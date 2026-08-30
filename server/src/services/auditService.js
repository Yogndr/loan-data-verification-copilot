const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  loanId = null,
  uploadId = null,
  action,
  actor = "SYSTEM",
  details = {},
  metadata = {},
}) => {
  try {
    // Get the most recent audit entry
    const lastAudit = await AuditLog.findOne()
      .sort({ createdAt: -1 })
      .lean();

    const previousHash =
      lastAudit?.currentHash || "GENESIS_HASH";

    // Create deterministic payload for hashing
    const payload = {
      loanId: loanId ? loanId.toString() : null,
      uploadId: uploadId ? uploadId.toString() : null,
      action,
      actor,
      details,
      metadata,
      previousHash,
    };

    const currentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    const auditLog = await AuditLog.create({
      loanId,
      uploadId,
      action,
      actor,
      details,
      metadata,
      previousHash,
      currentHash,
    });

    return auditLog;
  } catch (error) {
    console.error("Audit log error:", error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
};