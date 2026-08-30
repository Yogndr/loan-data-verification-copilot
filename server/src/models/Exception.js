const mongoose = require("mongoose");

const exceptionSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },

    exceptionType: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "IN_REVIEW",
        "CORRECTED",
        "APPROVED",
        "REJECTED",
      ],
      default: "OPEN",
    },

    field: {
      type: String,
      default: null,
    },

    actualValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    expectedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    source: {
      type: String,
      default: "VALIDATION_ENGINE",
    },

    aiReview: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "AIReview",
       default: null,
       },

    reviewerComment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exception", exceptionSchema);