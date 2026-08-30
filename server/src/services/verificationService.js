const crypto = require("crypto");

const Loan = require("../models/Loan");
const Exception = require("../models/Exception");
const VerifiedLoan = require("../models/VerifiedLoan");

const { createAuditLog } = require("./auditService");

/**
 * Calculates a SHA-256 hash over canonical loan fields.
 */
const generateRecordHash = (
  loanData,
  previousHash = "GENESIS_BLOCK"
) => {
  const payload = {
    loanId: loanData.loanId,
    borrowerId: loanData.borrowerId,
    originalPrincipal: loanData.originalPrincipal,
    currentBalance: loanData.currentBalance,
    interestRate: loanData.interestRate,
    paymentStatus: loanData.paymentStatus,
    previousHash,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};

/**
 * Verifies and seals a loan record into canonical VerifiedLoan state.
 */
const verifyLoanRecord = async (
  loanId,
  reviewerDecision = "APPROVED",
  user = null
) => {
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new Error("Loan not found");
  }

  // ----------------------------------------
  // Check unresolved exceptions
  // ----------------------------------------

  const openExceptions = await Exception.find({
    loanId: loan._id,
    status: {
      $in: ["OPEN", "IN_REVIEW"],
    },
  });

  if (openExceptions.length > 0) {
    throw new Error(
      `Cannot verify loan. There are ${openExceptions.length} unresolved exception(s).`
    );
  }

  // ----------------------------------------
  // Get previous audit hash
  // ----------------------------------------

  const AuditLog = require("../models/AuditLog");

  const lastAudit = await AuditLog.findOne()
    .sort({ createdAt: -1 })
    .lean();

  const previousHash =
    lastAudit?.currentHash || "GENESIS_HASH";

  // ----------------------------------------
  // Generate canonical record hash
  // ----------------------------------------

  const recordHash = generateRecordHash(
    loan,
    previousHash
  );

  // ----------------------------------------
  // Create VerifiedLoan
  // ----------------------------------------

  const verifiedLoan = await VerifiedLoan.create({
    loan: loan._id,

    canonicalData: {
      loanId: loan.loanId,
      borrowerId: loan.borrowerId,
      originalPrincipal: loan.originalPrincipal,
      currentBalance: loan.currentBalance,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      paymentStatus: loan.paymentStatus,
      daysPastDue: loan.daysPastDue,
      borrowerState: loan.borrowerState,
    },

    validationResult: "REVIEWED",

    reviewerDecision,

    // We don't have authentication yet,
    // so keep this null for now.
    verifiedBy: user,

    verifiedAt: new Date(),

    recordHash,

    sourceReferences: loan.sourceFile
      ? [loan.sourceFile]
      : [],
  });

  // ----------------------------------------
  // Mark loan as valid
  // ----------------------------------------

  loan.validationStatus = "VALID";

  await loan.save();

  // ----------------------------------------
  // Create audit event
  // ----------------------------------------

  await createAuditLog({
    loanId: loan._id,

    action: "VERIFIED_RECORD_CREATED",

    actor: "REVIEWER",

    details: {
      reviewerDecision,
      verifiedLoanId: verifiedLoan._id,
      recordHash,
    },

    metadata: {
      previousRecordHash: previousHash,
    },
  });

  return {
    verifiedLoan,
    recordHash,
  };
};

module.exports = {
  generateRecordHash,
  verifyLoanRecord,
};