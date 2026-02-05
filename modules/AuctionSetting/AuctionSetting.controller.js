const AuctionSetting = require("./AuctionSetting.model");
const path = require("path");
const fs = require("fs");

exports.getSettings = async function (req, res, next) {
  try {
    let settings = await AuctionSetting.findOne();
    
    if (!settings) {
      settings = await AuctionSetting.create({});
    }

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(200).json({
      status: "success",
      data: settings,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateSettings = async function (req, res, next) {
  try {
    let settings = await AuctionSetting.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });

    res.status(200).json({
      status: "success",
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.uploadBanner = async function (req, res, next) {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        status: "fail",
        message: "No banner image file provided",
      });
    }
    let settings = await AuctionSetting.findOne();
    if (!settings) {
      settings = await AuctionSetting.create({});
    }
    const oldBanner = settings.bannerImage;
    if (oldBanner) {
      const oldPath = path.join(__dirname, "../../public/banner", oldBanner);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    settings = await AuctionSetting.findOneAndUpdate(
      {},
      { bannerImage: req.file.filename },
      { new: true, upsert: true }
    );
    res.status(200).json({
      status: "success",
      message: "Banner uploaded successfully",
      data: settings,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.checkRegistrationStatus = async function (req, res, next) {
  try {
    let settings = await AuctionSetting.findOne();
    
    if (!settings) {
      return res.status(200).json({
        status: "success",
        registrationActive: false,
        message: "Registration is not active",
        registrationStartDate: null,
        registrationEndDate: null,
        registrationFieldsRequired: {
          photoRequired: true,
          nameRequired: true,
          mobileRequired: true,
          tshirtNameRequired: false,
          tshirtSizeRequired: false,
          tshirtNumberRequired: false,
          skillsRequired: false,
        },
      });
    }

    const now = new Date();
    const isActive = settings.registrationActive;
    const isWithinDateRange = 
      (!settings.registrationStartDate || now >= new Date(settings.registrationStartDate)) &&
      (!settings.registrationEndDate || now <= new Date(settings.registrationEndDate));

    const fieldsRequired = settings.registrationFieldsRequired || {
      photoRequired: true,
      nameRequired: true,
      mobileRequired: true,
      tshirtNameRequired: false,
      tshirtSizeRequired: false,
      tshirtNumberRequired: false,
      skillsRequired: false,
    };

    const payload = {
      status: "success",
      registrationActive: isActive && isWithinDateRange,
      message: isActive && isWithinDateRange ? "Registration is open" : "Registration is not active or outside date range",
      registrationStartDate: settings.registrationStartDate || null,
      registrationEndDate: settings.registrationEndDate || null,
      registrationFieldsRequired: fieldsRequired,
    };

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(200).json(payload);
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

