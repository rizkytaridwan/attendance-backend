import { Sequelize } from "sequelize";
import db from "../config/Database.js";
const { DataTypes } = Sequelize;

const Users = db.define('users',{
    uuid: {
        type: DataTypes.STRING,
        defaultValue:DataTypes.UUIDV4,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len:[3,100]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    departement: {
        type: DataTypes.STRING,
    },
    position: {
        type: DataTypes.STRING,

    },
    image:{
        type: DataTypes.STRING,
        allowNull: true,
    }
},{
    freezeTableName: true
});
export default Users;