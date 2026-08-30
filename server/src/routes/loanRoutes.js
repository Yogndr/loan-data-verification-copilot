const express = require("express");
const {
  getLoanById,
  verifyLoan,
  exportVerifiedLoans,
  getAuditTrail,
} = require("../controllers/loanController");

const router = express.Router();

router.get("/export", exportVerifiedLoans);
router.get("/audit-trail", getAuditTrail);
router.get("/:id", getLoanById);
router.post("/:id/verify", verifyLoan);

module.exports = router;