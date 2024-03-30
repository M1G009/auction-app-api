const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    logo: {
      type: String,
    },
    totalpurse: {
      type: Number,
      default: 78,
    },
    owner: { type: Schema.Types.ObjectId, ref: "user" },
    captain: { type: Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

teamSchema.set("toObject", { virtuals: true });
teamSchema.set("toJSON", { virtuals: true });

const team = mongoose.model("team", teamSchema);

module.exports = team;
