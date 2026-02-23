const express = require("express");
const router = express.Router();
const PdfController = require("./Pdf.controller");

router.get("/remaining-players", PdfController.remainingPlayersPdf);
router.get("/team-wise", PdfController.teamWisePdf);

module.exports = router;
