const AuctionSetting = require("./AuctionSetting.model");

exports.getSettings = async function (req, res, next) {
  try {
    let settings = await AuctionSetting.findOne();
    
    if (!settings) {
      settings = await AuctionSetting.create({});
    }

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

exports.checkRegistrationStatus = async function (req, res, next) {
  try {
    let settings = await AuctionSetting.findOne();
    
    if (!settings) {
      return res.status(200).json({
        status: "success",
        registrationActive: false,
        message: "Registration is not active",
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

    if (isActive && isWithinDateRange) {
      res.status(200).json({
        status: "success",
        registrationActive: true,
        message: "Registration is open",
        registrationFieldsRequired: fieldsRequired,
      });
    } else {
      res.status(200).json({
        status: "success",
        registrationActive: false,
        message: "Registration is not active or outside date range",
        registrationFieldsRequired: fieldsRequired,
      });
    }
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

