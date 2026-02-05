var express = require("express");
var router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const AuctionSettingController = require("./AuctionSetting.controller");
const AdminController = require("../admin/Admin.controller");

const bannerDir = path.join(__dirname, "../../public/banner");
if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
}

const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bannerDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.get("/", AuctionSettingController.getSettings);

router.get("/registration-status", AuctionSettingController.checkRegistrationStatus);

router.patch("/", AdminController.secure, AuctionSettingController.updateSettings);

router.post(
  "/banner",
  AdminController.secure,
  uploadBanner.single("banner"),
  AuctionSettingController.uploadBanner
);

module.exports = router;

