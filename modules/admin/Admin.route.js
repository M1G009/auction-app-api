var express = require("express");
var router = express.Router();
const AdminController = require("./Admin.controller");

/* Auth  */
router.post("/signup", AdminController.adminCreate);
router.post("/login", AdminController.login);
router.post("/checkadmin", AdminController.checkAdmin);

module.exports = router;
