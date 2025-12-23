var express = require("express");
var router = express.Router();
const TempUserController = require("./TempUser.controller");
const AdminController = require("../admin/Admin.controller");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp-users");
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

/* GET all temp users (admin only) */
router.get("/", AdminController.secure, TempUserController.getAllTempUsers);

/* GET all temp users (public - for viewing) */
router.get("/public", TempUserController.getAllTempUsersPublic);

/* CREATE temp user (public - registration) */
router.post("/", upload.single('photo'), TempUserController.createTempUser);

/* UPDATE temp user (admin only) */
router.patch("/:id", AdminController.secure, TempUserController.updateTempUser);

/* DELETE temp user (admin only) */
router.delete("/:id", AdminController.secure, TempUserController.deleteTempUser);

/* APPROVE and transfer temp user to main users (admin only) */
router.post("/:id/approve", AdminController.secure, TempUserController.approveTempUser);

module.exports = router;

