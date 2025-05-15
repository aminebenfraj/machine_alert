const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const rolesEnum = [
  "Admin","User", "PRODUCCION","LOGISTICA" ];

const userSchema = new Schema(
  {
    license: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String], // ✅ Users can have multiple roles.
      enum: rolesEnum,
      required: true,
      default: ["User"], // ✅ Change default from "user" to "User"
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
