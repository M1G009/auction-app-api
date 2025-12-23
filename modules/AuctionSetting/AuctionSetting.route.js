var express = require("express");
var router = express.Router();
const AuctionSettingController = require("./AuctionSetting.controller");
const AdminController = require("../admin/Admin.controller");

/* GET settings */
router.get("/", AuctionSettingController.getSettings);

/* Check registration status (public) */
router.get("/registration-status", AuctionSettingController.checkRegistrationStatus);

/* UPDATE settings (admin only) */
router.patch("/", AdminController.secure, AuctionSettingController.updateSettings);

module.exports = router;

