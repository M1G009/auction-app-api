const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    auctionName: {
      type: String,
    },
    maxPlayersPerteam: {
      type: Number,
    },
    reservePlayersPerTeam: {
      type: Number,
    },
    startBid: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("AuctionSettings", userSchema);

