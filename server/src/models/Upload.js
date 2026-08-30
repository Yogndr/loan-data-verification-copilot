const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      default: "CSV",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    successfulRows: {
      type: Number,
      default: 0,
    },

    failedRows: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Upload", uploadSchema);