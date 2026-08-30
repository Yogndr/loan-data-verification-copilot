const AuditLog = require("../models/AuditLog");

const getLoanAuditTrail = async (req, res) => {
  try {
    const { loanId } = req.params;

    const auditLogs = await AuditLog.find({ loanId })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        auditLogs,
      },
    });
  } catch (error) {
    console.error("Audit trail error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit trail",
      error: error.message,
    });
  }
};

module.exports = {
  getLoanAuditTrail,
};