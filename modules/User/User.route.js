var express = require("express");
var router = express.Router();
const UserController = require("./User.controller");
const AdminController = require("../admin/Admin.controller");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/player");
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

/* USER  */
router.get("/", UserController.AllUsers);
// router.get("/updatephoto", UserController.AllUsers);
router.post("/", AdminController.secure, upload.single('photo'), UserController.UserCreate);
router.post(
  "/addimage",
  AdminController.secure,
  upload.array("players", 15),
  UserController.addImages
);
router.patch("/:id", AdminController.secure, UserController.UserUpdate);
router.delete("/:id", AdminController.secure, UserController.UserDelete);

module.exports = router;
