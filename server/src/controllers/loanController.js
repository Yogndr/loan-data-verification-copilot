// const Loan = require("../models/Loan");
// const Exception = require("../models/Exception");
// const VerifiedRecord = require("../models/VerifiedRecord");
// const AuditLog = require("../models/AuditLog");

// const getLoanById = async (req, res) => {
//   try {
//     const loan = await Loan.findById(req.params.id).lean();

//     if (!loan) {
//       return res.status(404).json({
//         success: false,
//         message: "Loan not found",
//       });
//     }

//     const [exceptions, verification, auditLogs] =
//       await Promise.all([
//         Exception.find({
//           loanId: loan._id,
//         })
//           .sort({ createdAt: -1 })
//           .lean(),

//         VerifiedRecord.findOne({
//           loanId: loan._id,
//         }).lean(),

//         AuditLog.find({
//           loanId: loan._id,
//         })
//           .sort({ createdAt: -1 })
//           .lean(),
//       ]);

//     res.json({
//       success: true,
//       data: {
//         loan,
//         exceptions,
//         verification,
//         auditLogs,
//       },
//     });
//   } catch (error) {
//     console.error("Get loan error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch loan",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   getLoanById,
// };

const Loan = require("../models/Loan");
const VerifiedLoan = require("../models/VerifiedLoan");
const AuditLog = require("../models/AuditLog");
const { verifyLoanRecord } = require("../services/verificationService");

const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyLoan = async (req, res) => {
  try {
    const { comment } = req.body;
    const result = await verifyLoanRecord(req.params.id, comment || "APPROVED");

    res.json({
      success: true,
      message: "Loan verified and cryptographically sealed successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const exportVerifiedLoans = async (req, res) => {
  try {
    const verified = await VerifiedLoan.find().populate("loan");
    const format = req.query.format || "json";

    if (format === "csv") {
      const headers = "loanId,borrowerId,originalPrincipal,currentBalance,interestRate,paymentStatus,recordHash,verifiedAt\n";
      const rows = verified
        .map((v) => {
          const d = v.canonicalData;
          return `"${d.loanId}","${d.borrowerId}",${d.originalPrincipal},${d.currentBalance},${d.interestRate},"${d.paymentStatus}","${v.recordHash}","${v.verifiedAt.toISOString()}"`;
        })
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=verified_loans.csv");
      return res.send(headers + rows);
    }

    res.json({ success: true, data: verified });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditTrail = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLoanById,
  verifyLoan,
  exportVerifiedLoans,
  getAuditTrail,
};