const TempUser = require("./TempUser.model");
const User = require("../User/User.model");
const fs = require("fs");
const path = require("path");

exports.getAllTempUsers = async function (req, res, next) {
  try {
    let tempUsers = await TempUser.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Temp users fetched successfully",
      data: tempUsers,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getAllTempUsersPublic = async function (req, res, next) {
  try {
    let tempUsers = await TempUser.find().sort({ createdAt: -1 }).select('-__v');

    res.status(200).json({
      status: "success",
      message: "Temp users fetched successfully",
      data: tempUsers,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.createTempUser = async function (req, res, next) {
  try {
    // Check if registration is active
    const AuctionSetting = require("../AuctionSetting/AuctionSetting.model");
    const settings = await AuctionSetting.findOne();
    
    if (!settings || !settings.registrationActive) {
      return res.status(400).json({
        status: "fail",
        message: "Registration is not currently active",
      });
    }

    const now = new Date();
    const isWithinDateRange = 
      (!settings.registrationStartDate || now >= new Date(settings.registrationStartDate)) &&
      (!settings.registrationEndDate || now <= new Date(settings.registrationEndDate));

    if (!isWithinDateRange) {
      return res.status(400).json({
        status: "fail",
        message: "Registration is outside the allowed date range",
      });
    }

    // Check if mobile number already exists in temp users
    const existingTempUser = await TempUser.findOne({ mobile: req.body.mobile });
    if (existingTempUser) {
      return res.status(400).json({
        status: "fail",
        message: "A player with this mobile number is already registered",
      });
    }

    // Check if mobile number already exists in main users
    const existingUser = await User.findOne({ mobile: req.body.mobile });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "A player with this mobile number already exists",
      });
    }

    // Prepare user data
    const userData = {
      name: req.body.name,
      mobile: req.body.mobile,
      wicketkeeper: req.body.wicketkeeper === 'true' || req.body.wicketkeeper === true,
      batstyle: req.body.batstyle === 'true' || req.body.batstyle === true,
      bowlstyle: req.body.bowlstyle === 'true' || req.body.bowlstyle === true,
      type: 'Player', // Always set to Player
      tshirtName: req.body.tshirtName || '',
      tshirtSize: req.body.tshirtSize || '',
      tshirtNumber: req.body.tshirtNumber || '',
    };

    // Add photo filename if uploaded
    if (req.file) {
      userData.photo = req.file.filename;
    }

    let newTempUser = await TempUser.create(userData);

    res.status(201).json({
      status: "success",
      message: "Registration successful. Your application is pending admin approval.",
      data: newTempUser,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateTempUser = async function (req, res, next) {
  try {
    let updatedTempUser = await TempUser.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedTempUser) {
      return res.status(404).json({
        status: "fail",
        message: "Temp user not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Temp user updated successfully",
      data: updatedTempUser,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteTempUser = async function (req, res, next) {
  try {
    let deletedTempUser = await TempUser.findByIdAndDelete(req.params.id);

    if (!deletedTempUser) {
      return res.status(404).json({
        status: "fail",
        message: "Temp user not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Temp user deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.approveTempUser = async function (req, res, next) {
  try {
    let tempUser = await TempUser.findById(req.params.id);

    if (!tempUser) {
      return res.status(404).json({
        status: "fail",
        message: "Temp user not found",
      });
    }

    // Check if mobile number already exists in main users
    const existingUser = await User.findOne({ mobile: tempUser.mobile });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "A player with this mobile number already exists in the main users",
      });
    }

    // Convert temp user to user object
    const userData = tempUser.toObject();
    delete userData._id;
    delete userData.__v;

    // Move photo file from temp-users to player directory if it exists
    if (tempUser.photo) {
      const tempPhotoPath = path.join(__dirname, "../../public/temp-users", tempUser.photo);
      const playerPhotoPath = path.join(__dirname, "../../public/player", tempUser.photo);

      // Check if source file exists
      if (fs.existsSync(tempPhotoPath)) {
        // Ensure player directory exists
        const playerDir = path.join(__dirname, "../../public/player");
        if (!fs.existsSync(playerDir)) {
          fs.mkdirSync(playerDir, { recursive: true });
        }

        // Copy file from temp-users to player directory
        fs.copyFileSync(tempPhotoPath, playerPhotoPath);

        // Optionally delete the original file from temp-users
        // fs.unlinkSync(tempPhotoPath);
      } else {
        // If file doesn't exist, set photo to empty string
        userData.photo = "";
      }
    }

    // Create user in main collection
    let newUser = await User.create(userData);

    // Delete temp user
    await TempUser.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Temp user approved and transferred to main users",
      data: newUser,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

