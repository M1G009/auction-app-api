const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tempUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
    },
    mobile: {
      type: String,
    },
    wicketkeeper: {
      type: Boolean,
      default: false,
    },
    batstyle: {
      type: Boolean,
      default: false,
    },
    bowlstyle: {
      type: Boolean,
      default: false,
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
    tshirtName: {
      type: String,
      required: false,
    },
    tshirtSize: {
      type: String,
      required: false,
    },
    tshirtNumber: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

tempUserSchema.set("toObject", { virtuals: true });
tempUserSchema.set("toJSON", { virtuals: true });

const TEMPUSER = mongoose.model("tempuser", tempUserSchema);

module.exports = TEMPUSER;

