var express = require("express");
var router = express.Router();
const TeamController = require("./Team.controller");
const AdminController = require("../admin/Admin.controller");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/team");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/* Team  */
router.get("/", TeamController.AllTeams);
router.post("/", AdminController.secure, upload.single('logo'), TeamController.TeamCreate);
router.patch("/:id", AdminController.secure, upload.single('logo'), TeamController.TeamUpdate);
router.delete("/:id", AdminController.secure, TeamController.TeamDelete);

module.exports = router;
