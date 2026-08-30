const { verifyLoanRecord } = require("../services/verificationService");

const verifyLoan = async (req, res) => {
  try {
    const { comment = "" } = req.body;
    const loanId = req.params.id;

    const result = await verifyLoanRecord(
      loanId,
      "APPROVED",
      "REVIEWER"
    );

    res.json({
      success: true,
      message: "Loan verified and cryptographically sealed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Verify loan error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  verifyLoan,
};