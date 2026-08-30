const express = require("express");

const {
  getLoanAuditTrail,
} = require("../controllers/auditController");

const router = express.Router();

router.get("/:loanId", getLoanAuditTrail);

module.exports = router;