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
    registrationActive: {
      type: Boolean,
      default: false,
    },
    registrationStartDate: {
      type: Date,
    },
    registrationEndDate: {
      type: Date,
    },
    bannerImage: {
      type: String,
    },
    registrationFieldsRequired: {
      photoRequired: {
        type: Boolean,
        default: true,
      },
      nameRequired: {
        type: Boolean,
        default: true,
      },
      mobileRequired: {
        type: Boolean,
        default: true,
      },
      tshirtNameRequired: {
        type: Boolean,
        default: false,
      },
      tshirtSizeRequired: {
        type: Boolean,
        default: false,
      },
      tshirtNumberRequired: {
        type: Boolean,
        default: false,
      },
      skillsRequired: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("AuctionSettings", userSchema);

