import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Payroll = db.define("Payroll", {
  uuid: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
    validate: {
      notEmpty: true,
    },
  },
  base_salary: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3000000,
  },
  total_deductions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_overtime_payment: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  final_salary: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER, 
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
}, {
  freezeTableName: true,
});

Users.hasMany(Payroll, { foreignKey: "userId" });
Payroll.belongsTo(Users, { foreignKey: "userId" });

export default Payroll;
