var express = require("express");
var router = express.Router();
const UserController = require("./User.controller");
const AdminController = require("../admin/Admin.controller");

/* USER  */
router.get("/", UserController.AllUsers);
router.post("/", AdminController.secure, UserController.UserCreate);
router.patch("/:id", AdminController.secure, UserController.UserUpdate);

module.exports = router;
