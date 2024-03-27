const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var validator = require("validator");

const adminSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter valid name"],
    },
    email: {
      type: String,
      unique: [true, "Email is already exist"],
      required: [true, "Please enter email"],
      validate: [validator.isEmail, "Please enter valid email"],
    },
    password: {
      type: String,
      required: [true, "Please enter password"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    UpdatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

adminSchema.set("toObject", { virtuals: true });
adminSchema.set("toJSON", { virtuals: true });

const Admin = mongoose.model("admin", adminSchema);

module.exports = Admin;
