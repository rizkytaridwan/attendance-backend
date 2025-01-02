import { Op } from "sequelize";
import db from "../config/Database.js";
import Payroll from "../models/PayrollModel.js";
import Deductions from "../models/DeductionsModel.js";
import Over from "../models/OvertimeModel.js";
import Users from "../models/UserModel.js";

// Extract validation logic to a separate function
function validatePayrollDate(month, year) {
  const currentDate = new Date();
  if (!month || !year) {
    throw new Error("Month and year are required.");
  }
  if (typeof month !== "number" || month < 1 || month > 12) {
    throw new Error("Month must be a number between 1 and 12.");
  }
  if (year > currentDate.getFullYear() || (year === currentDate.getFullYear() && month > currentDate.getMonth() + 1)) {
    throw new Error("Cannot generate payroll for future months.");
  }
  if (year < currentDate.getFullYear() || (year === currentDate.getFullYear() && month < currentDate.getMonth() + 1)) {
    throw new Error("Cannot generate payroll for past months.");
  }
}

export const generatePayroll = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { month, year } = req.body;
    validatePayrollDate(month, year);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const users = await Users.findAll();

    for (const user of users) {
      const { deductions, overtimePayments } = await calculatePayrollDetails(user.id, startDate, endDate);
      const baseSalary = getBaseSalary();
      const finalSalary = calculateFinalSalary(baseSalary, overtimePayments, deductions);

      await updateOrCreatePayroll(user.id, month, year, baseSalary, deductions, overtimePayments, finalSalary, transaction);
    }

    await transaction.commit();
    res.status(200).json({ message: `Payroll for ${month}-${year} generated successfully!` });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

export const getAllPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findAll({
      attributes: ['uuid', 'base_salary', 'total_deductions', 'total_overtime_payment', 'final_salary', 'month', 'year'],
      include: [{
        model: Users,
        attributes: ['uuid', 'name'],
      }],
    });
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

async function calculatePayrollDetails(userId, startDate, endDate) {
  const totalDeductions = await Deductions.sum("amount", { where: { userId, createdAt: { [Op.between]: [startDate, endDate] } } }) || 0;
  const overtimePayments = await Over.sum("overtime_payment", { where: { userId, status: "Approved", createdAt: { [Op.between]: [startDate, endDate] } } }) || 0;
  return { deductions: totalDeductions, overtimePayments };
}

function getBaseSalary() {
  return 3000000;
}

function calculateFinalSalary(baseSalary, overtimePayments, deductions) {
  return baseSalary + overtimePayments - deductions;
}

async function updateOrCreatePayroll(userId, month, year, baseSalary, deductions, overtimePayments, finalSalary, transaction) {
  const existingPayroll = await Payroll.findOne({ where: { userId, month, year } });
  if (existingPayroll) {
    return await Payroll.update({ base_salary: baseSalary, total_deductions: deductions, total_overtime_payment: overtimePayments, final_salary: finalSalary }, { where: { userId, month, year }, transaction });
  } else {
    return await Payroll.create({ userId, base_salary: baseSalary, total_deductions: deductions, total_overtime_payment: overtimePayments, final_salary: finalSalary, month, year }, { transaction });
  }
}
