import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
});

export default User;
