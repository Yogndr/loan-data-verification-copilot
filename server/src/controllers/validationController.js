const {
  validateAllLoans,
} = require("../services/validationService");

const runValidation = async (req, res) => {
  try {
    const result = await validateAllLoans();

    res.json({
      success: true,
      message: "Validation completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Validation error:", error);

    res.status(500).json({
      success: false,
      message: "Validation failed",
      error: error.message,
    });
  }
};

module.exports = {
  runValidation,
};