const express = require("express");
const multer = require("multer");

const {
  uploadLoanFile,
} = require("../controllers/uploadController");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/",
  upload.single("file"),
  uploadLoanFile
);

module.exports = router;