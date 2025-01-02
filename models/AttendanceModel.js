import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Attendance = db.define(
  "Attendance",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    check_in_time: {
      type: DataTypes.DATE,
    },
    check_out_time: {
      type: DataTypes.DATE,
    },
    location_latitude: {
      type: DataTypes.STRING(255),
    },
    location_longitude: {
      type: DataTypes.STRING(255),
    },
    check_in_image: {
      type: DataTypes.STRING, 
    },
    check_out_image: {
      type: DataTypes.STRING, 
    },
    check_in_ip: {
      type: DataTypes.STRING, 
    },
    check_out_ip: {
      type: DataTypes.STRING, 
    },
    status: {
      type: DataTypes.STRING,
    },
    lateness_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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

Users.hasMany(Attendance, { foreignKey: "userId" });
Attendance.belongsTo(Users, { foreignKey: "userId" });

export default Attendance;
