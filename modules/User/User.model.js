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
    wicketkeeper: {
      type: Boolean,
    },
    batstyle: {
      type: Boolean,
    },
    bowlstyle: {
      type: Boolean,
    },
    rank: {
      type: Number,
      default: 2,
    },
    type: {
      type: String,
      enum: ["Captain", "IconPlayer", "Player"],
      default: "Player",
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
