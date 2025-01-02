import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Salaries = db.define(
  "Salaries",
  {
    uuid_salaries: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    base_salary: {
      type: DataTypes.INTEGER(10),
    },
    allowance: {
      type: DataTypes.INTEGER(10),
    },
    deduction: {
      type: DataTypes.INTEGER(10),
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    freezeTableName: true,
  }
);

Users.hasMany(Salaries, { foreignKey: "userId" });
Salaries.belongsTo(Users, { foreignKey: "userId" });

export default Salaries;
