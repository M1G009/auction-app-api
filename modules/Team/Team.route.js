var express = require("express");
var router = express.Router();
const TeamController = require("./Team.controller");
const AdminController = require("../admin/Admin.controller");

/* Team  */
router.get("/", TeamController.AllTeams);
router.post("/", AdminController.secure, TeamController.TeamCreate);
router.patch("/:id", AdminController.secure, TeamController.TeamUpdate);

module.exports = router;
