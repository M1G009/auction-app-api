const Admin = require("./Admin.model");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

exports.secure = async function (req, res, next) {
  try {
    if (!req.headers.authorization) {
      throw new Error("Token not found");
    }

    let token = req.headers.authorization;

    let checkToken = jwt.verify(token, process.env.SECRET_KEY_ADMIN);
    if (!checkToken || !checkToken.id) {
      throw new Error("Token is not valid");
    }

    let checkAdmin = await Admin.findById(checkToken.id);

    if (!checkAdmin) {
      throw new Error("Admin not found");
    }

    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.checkAdmin = async function (req, res, next) {
  try {
    if (!req.headers.authorization) {
      throw new Error("Token not found");
    }

    let token = req.headers.authorization;

    let checkToken = jwt.verify(token, process.env.SECRET_KEY_ADMIN);
    if (!checkToken || !checkToken.id) {
      throw new Error("Token is not valid");
    }

    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.adminCreate = async function (req, res, next) {
  try {
    if (!req.body.email || !req.body.password || !req.body.name) {
      throw new Error("Please enter valid fields");
    }

    req.body.password = await bcrypt.hash(req.body.password, 10);

    let newAdmin = await Admin.create(req.body);

    res.status(200).json({
      status: "success",
      data: newAdmin,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.login = async function (req, res, next) {
  try {
    if (!req.body.email || !req.body.password) {
      throw new Error("Please enter valid fields");
    }

    let checkAdmin = await Admin.findOne({ email: req.body.email });
    if (!checkAdmin) {
      throw new Error("User not found");
    }

    let checkPassword = await bcrypt.compare(
      req.body.password,
      checkAdmin.password
    );

    if (!checkPassword) {
      throw new Error("Please enter valid password");
    }

    let token = jwt.sign({ id: checkAdmin.id }, process.env.SECRET_KEY_ADMIN);

    res.status(200).json({
      status: "success",
      data: checkAdmin,
      token: token,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};
