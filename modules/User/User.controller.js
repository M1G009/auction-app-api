const Team = require("../Team/Team.model");
const USER = require("./User.model");
const TempUser = require("../TempUser/TempUser.model");
const fs = require("fs");
const path = require("path");

exports.AllUsers = async function (req, res, next) {
  try {
    let allUsersData = await USER.find().sort({ playerNumber: 1, _id: 1 }).populate("team");

    res.status(200).json({
      status: "success",
      message: "User find successful",
      data: allUsersData,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.addImages = async function (req, res, next) {
  try {
    res.status(200).json({
      status: "success",
      message: "User find successful",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.UserCreate = async function (req, res, next) {
  try {
    // Check if req.body is an array (bulk create) or single object
    if (Array.isArray(req.body)) {
      const count = await USER.countDocuments();
      let copyData = [...req.body].map((el, index) => {
        return {
          ...el,
          photo: el.photo || (index + 1 + ".jpg"),
          playerNumber: count + index + 1,
        };
      });

      let newUser = await USER.insertMany(copyData);

      res.status(201).json({
        status: "success",
        message: "Users create successful",
        data: newUser,
      });
    } else {
      // Single user creation with file upload support
      const userData = {
        name: req.body.name,
        mobile: req.body.mobile,
        type: req.body.type || 'Player',
        wicketkeeper: req.body.wicketkeeper === 'true' || req.body.wicketkeeper === true,
        batstyle: req.body.batstyle === 'true' || req.body.batstyle === true,
        bowlstyle: req.body.bowlstyle === 'true' || req.body.bowlstyle === true,
        tshirtName: req.body.tshirtName || '',
        tshirtSize: req.body.tshirtSize || '',
        tshirtNumber: req.body.tshirtNumber || '',
      };

      if (req.file) {
        userData.photo = req.file.filename;
      } else {
        userData.photo = "default.jpg";
      }

      const count = await USER.countDocuments();
      userData.playerNumber = count + 1;

      let newUser = await USER.create(userData);

      res.status(201).json({
        status: "success",
        message: "User create successful",
        data: newUser,
      });
    }
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.UserUpdate = async function (req, res, next) {
  try {
    // req.body.name
    let newUser = await USER.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (
      (req.body.type == "Owner" || req.body.type == "Captain") &&
      newUser?.team?._id
    ) {
      await Team.findByIdAndUpdate(newUser.team._id.toString(), {
        [req.body.type.toLowerCase()]: newUser._id.toString(),
      });
    }

    res.status(201).json({
      status: "success",
      message: "USER update successful",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.UserDelete = async function (req, res, next) {
  try {
    let deletedUser = await USER.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.makePending = async function (req, res, next) {
  try {
    const user = await USER.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    if (user.team) {
      return res.status(400).json({
        status: "fail",
        message: "Cannot move sold player to pending",
      });
    }

    const allowedTypes = ["Captain", "IconPlayer", "Player"];
    const tempUserData = {
      name: user.name,
      mobile: user.mobile,
      wicketkeeper: !!user.wicketkeeper,
      batstyle: !!user.batstyle,
      bowlstyle: !!user.bowlstyle,
      type: allowedTypes.includes(user.type) ? user.type : "Player",
      tshirtName: user.tshirtName || "",
      tshirtSize: user.tshirtSize || "",
      tshirtNumber: user.tshirtNumber || "",
      photo: user.photo || ""
    };

    if (user.photo) {
      const playerPhotoPath = path.join(__dirname, "../../public/player", user.photo);
      const tempPhotoPath = path.join(__dirname, "../../public/temp-users", user.photo);
      const tempDir = path.join(__dirname, "../../public/temp-users");

      if (fs.existsSync(playerPhotoPath)) {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        fs.copyFileSync(playerPhotoPath, tempPhotoPath);
      } else {
        tempUserData.photo = "";
      }
    }

    await TempUser.create(tempUserData);
    await USER.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Player moved to pending list",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};
