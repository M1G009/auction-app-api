const Team = require("../Team/Team.model");
const USER = require("./User.model");

exports.AllUsers = async function (req, res, next) {
  try {
    let allUsersData = await USER.find();

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
    // req.body.
    let copyData = [...req.body].map((el) => {
      return { ...el, photo: el.no + ".jpeg" };
    });

    let newUser = await USER.insertMany(copyData);

    res.status(201).json({
      status: "success",
      message: "User create successful",
      data: newUser,
    });
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
