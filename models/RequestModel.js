import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Requests = db.define(
  "Requests",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    start_date: {
      type: DataTypes.DATE,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    reason: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    leave_type: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
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

Users.hasMany(Requests, { foreignKey: "userId" });
Requests.belongsTo(Users, { foreignKey: "userId" });

export default Requests;
