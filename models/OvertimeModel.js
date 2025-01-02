import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Over = db.define(
  "Over",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    date: {
      type: DataTypes.DATE,
    },
    hours: {
      type: DataTypes.DECIMAL(5, 2),
    },
    description: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    overtime_rate: {
      type: DataTypes.INTEGER(10),
    },
    overtime_payment: {
      type: DataTypes.INTEGER(10),
    },
    approved_by: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
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

Users.hasMany(Over, { foreignKey: "userId" });
Over.belongsTo(Users, { foreignKey: "userId" });

export default Over;
