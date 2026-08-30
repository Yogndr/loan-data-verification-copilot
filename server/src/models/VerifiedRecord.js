const mongoose = require("mongoose");

const verifiedRecordSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      unique: true,
    },

    verifiedBy: {
      type: String,
      default: "REVIEWER",
    },

    verificationStatus: {
      type: String,
      enum: ["VERIFIED", "REJECTED"],
      required: true,
    },

    reviewerComment: {
      type: String,
      default: "",
    },

    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VerifiedRecord",
  verifiedRecordSchema
);