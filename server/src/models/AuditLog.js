const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
    },

    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      default: null,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "FILE_UPLOADED",
        "LOAN_IMPORTED",
        "VALIDATION_EXECUTED",
        "EXCEPTION_CREATED",
        "AI_RECOMMENDATION_GENERATED",
        "REVIEWER_COMMENT_ADDED",
        "FIELD_EDITED",
        "EXCEPTION_APPROVED",
        "EXCEPTION_REJECTED",
        "EXCEPTION_CORRECTION_REQUESTED",
        "VERIFIED_RECORD_CREATED",
        "VERIFIED_RECORD_EXPORTED",
      ],
    },

    actor: {
      type: String,
      default: "SYSTEM",
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    previousHash: {
      type: String,
      default: "GENESIS_HASH",
    },

    currentHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);