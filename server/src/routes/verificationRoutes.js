const express = require("express");

const {
  verifyLoan,
} = require("../controllers/verificationController");

const router = express.Router();

router.post("/:id/verify", verifyLoan);

module.exports = router;