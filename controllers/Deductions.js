import Deductions from "../models/DeductionsModel.js";
import Users from "../models/UserModel.js";
import { Op,fn,col } from "sequelize";

export const createDeduction = async (req, res) => {
  try {
    const { type, amount, description, userId } = req.body;
    const deduction = await Deductions.create({
      type,
      amount,
      description,
      userId,
    });
    res.status(201).json(deduction);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAllDeductions = async (req, res) => {
  try {
    const deductions = await Deductions.findAll({
      attributes: ['uuid_deductions', 'type', 'amount', 'description'],
      include: [
        {
          model: Users,
          attributes: ["uuid", "name"],
        },
      ],
    });
    res.status(200).json(deductions);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDeductionById = async (req, res) => {
  try {
    const deduction = await Deductions.findOne({
      where: { uuid_deductions: req.params.id },
      attributes: ['uuid_deductions', 'type', 'amount', 'description'],
      include: [
        {
          model: Users,
          attributes: ["uuid", "name"],
        },
      ],
    });
    if (!deduction) return res.status(404).json({ msg: "Deduction Not Found" });
    res.status(200).json(deduction);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateDeduction = async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const deduction = await Deductions.findOne({
      where: { uuid_deductions: req.params.id },
    });
    if (!deduction) return res.status(404).json({ msg: "Deduction Not Found" });

    await deduction.update({
      type,
      amount,
      description,
    });
    res.status(200).json(deduction);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteDeduction = async (req, res) => {
  try {
    const deduction = await Deductions.findOne({
      where: { uuid_deductions: req.params.id },
    });
    if (!deduction) return res.status(404).json({ msg: "Deduction Not Found" });

    await deduction.destroy();
    res.status(200).json({ msg: "Deduction Deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDeductionsInMonthByUserId = async (req, res) => {
  try {
    const { userId, month, year } = req.body; 
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const deductions = await Deductions.findAll({
      attributes: ['uuid_deductions', 'type', 'amount', 'description'],
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Users,
          attributes: ["uuid", "name"],
        },
      ],
    });

    const totalAmount = await Deductions.sum('amount', {
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    res.status(200).json({
      totalAmount,
      deductions,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDeductionBySession = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    const user = await Users.findOne({ where: { uuid: userId } });
    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const deductions = await Deductions.findAll({
      attributes: ['uuid_deductions', 'type', 'amount', 'description'],
      where: { userId: user.id },
      include: [
        {
          model: Users,
          attributes: ["uuid", "name","departement","position"],
        },
      ],
    });

    res.status(200).json(deductions);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
