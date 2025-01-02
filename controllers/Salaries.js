import Salaries from "../models/SalariesModel.js";
import Users from "../models/UserModel.js";

export const createSalaries = async (req, res) => {
  try {
    const { base_salary, allowance, deduction, userId } = req.body;
    const salary = await Salaries.create({
      base_salary,
      allowance,
      deduction,
      userId,
    });
    res.status(201).json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalaries = async (req, res) => {
  try {
    const salaries = await Salaries.findAll({
      include: [
        {
          model: Users,
          attributes: ["name","departement", "position"],
        },
      ],
    });
    res.status(200).json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalariesById = async (req, res) => {
  try {
    const { uuid } = req.params;
    const salary = await Salaries.findOne({
      where: { uuid_salaries: uuid },
      include: [
        {
          model: Users,
          attributes: ["name", "departement", "position"],
        },
      ],
    });
    if (!salary) return res.status(404).json({ message: "Salary not found" });
    res.status(200).json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSalaries = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { base_salary, allowance, deduction } = req.body;
    const salary = await Salaries.findOne({ where: { uuid_salaries: uuid } });
    if (!salary) return res.status(404).json({ message: "Salary not found" });

    await Salaries.update(
      { base_salary, allowance, deduction },
      { where: { uuid_salaries: uuid } }
    );
    res.status(200).json({ message: "Salary updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSalaries = async (req, res) => {
  try {
    const { uuid } = req.params;
    const salary = await Salaries.findOne({ where: { uuid_salaries: uuid } });
    if (!salary) return res.status(404).json({ message: "Salary not found" });

    await Salaries.destroy({ where: { uuid_salaries: uuid } });
    res.status(200).json({ message: "Salary deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
