const { importLoanCSV } = require("../services/uploadService");

const uploadLoanFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const result = await importLoanCSV(
      req.file,
      req.user?._id
    );

    res.status(201).json({
      success: true,
      message: "Loan CSV imported successfully",
      data: result,
    });
  } catch (error) {
    console.error("CSV upload error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to import CSV",
      error: error.message,
    });
  }
};

module.exports = {
  uploadLoanFile,
};