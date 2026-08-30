const express = require("express");

const {
  runValidation,
} = require("../controllers/validationController");

const Loan = require("../models/Loan");

const router = express.Router();

router.post("/run", runValidation);

router.get("/count", async (req, res) => {
  try {
    const count = await Loan.countDocuments();

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;