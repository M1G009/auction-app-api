var express = require("express");
var router = express.Router();
const UserController = require("./User.controller");
const AdminController = require("../admin/Admin.controller");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/player");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

/* USER  */
router.get("/", UserController.AllUsers);
// router.get("/updatephoto", UserController.AllUsers);
router.post("/", AdminController.secure, UserController.UserCreate);
router.post(
  "/addimage",
  AdminController.secure,
  upload.array("players", 15),
  UserController.addImages
);
router.patch("/:id", AdminController.secure, UserController.UserUpdate);

module.exports = router;
