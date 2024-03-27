const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    photo: {
      type: String,
    },
    mobile: {
      type: String,
    },
    age: {
      type: String,
    },
    allrounder: {
      type: String,
    },
    wicketkeeper: {
      type: String,
    },
    batstyle: {
      type: String,
    },
    bowlstyle: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Owner", "Captain", "A", "B", "C"],
    },
    team: { type: Schema.Types.ObjectId, ref: "team" },
    finalprice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

const USER = mongoose.model("user", userSchema);

module.exports = USER;
