const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      index: true,
    },

    borrowerId: {
      type: String,
      index: true,
    },

    loanType: String,

    originationDate: Date,

    maturityDate: Date,

    originalPrincipal: Number,

    currentBalance: Number,

    interestRate: Number,

    termMonths: Number,

    borrowerState: String,

    loanPurpose: String,

    creditGrade: String,

    employmentLength: String,

    incomeBand: String,

    paymentStatus: String,

    daysPastDue: Number,

    servicerName: String,

    lastPaymentDate: Date,

    lastUpdatedAt: Date,

    documentStatus: String,

    sourceSystem: String,

    sourceFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
    },

    validationStatus: {
      type: String,
      enum: ["PENDING", "VALID", "EXCEPTION"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Loan", loanSchema);