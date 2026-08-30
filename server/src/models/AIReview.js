const mongoose = require("mongoose");

const aiReviewSchema = new mongoose.Schema(
  {
    exception: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exception",
      required: true,
    },

    explanation: String,

    recommendation: String,

    suggestedValue: mongoose.Schema.Types.Mixed,

    confidence: Number,

    evidence: [String],

    model: String,

    prompt: String,

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    decision: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "EDITED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIReview", aiReviewSchema);