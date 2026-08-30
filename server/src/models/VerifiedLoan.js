const mongoose = require("mongoose");

const verifiedLoanSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },

    canonicalData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    validationResult: {
      type: String,
      enum: ["VALID", "REVIEWED"],
      required: true,
    },

    reviewerDecision: {
      type: String,
      required: true,
    },

    aiRecommendation: mongoose.Schema.Types.Mixed,

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: Date.now,
    },

    recordHash: {
      type: String,
      required: true,
    },

    sourceReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Upload",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VerifiedLoan", verifiedLoanSchema);