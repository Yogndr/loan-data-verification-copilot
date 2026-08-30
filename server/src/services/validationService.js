const Loan = require("../models/Loan");
const Exception = require("../models/Exception");
const { createAuditLog } = require("./auditService");

const VALID_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC"
];

const VALID_PAYMENT_STATUSES = [
  "CURRENT",
  "30+ DPD",
  "60+ DPD",
  "90+ DPD",
  "CLOSED"
];

const STALE_RECORD_DAYS = 90;

const createException = (loan, data) => ({
  loanId: loan._id,
  ...data
});

const validateLoan = (loan) => {
  const exceptions = [];

  // R001 - Missing required fields
  const requiredFields = [
    "loanId",
    "borrowerId",
    "originationDate",
    "originalPrincipal",
    "currentBalance"
  ];

  requiredFields.forEach((field) => {
    if (
      loan[field] === null ||
      loan[field] === undefined ||
      loan[field] === ""
    ) {
      exceptions.push(
        createException(loan, {
          exceptionType: "MISSING_REQUIRED_FIELD",
          message: `${field} is required`,
          severity: "CRITICAL",
          field,
          actualValue: loan[field]
        })
      );
    }
  });

  // R002 - Negative principal
  if (
    loan.originalPrincipal !== null &&
    loan.originalPrincipal !== undefined &&
    loan.originalPrincipal < 0
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "NEGATIVE_PRINCIPAL",
        message: "Original principal cannot be negative",
        severity: "CRITICAL",
        field: "originalPrincipal",
        actualValue: loan.originalPrincipal,
        expectedValue: ">= 0"
      })
    );
  }

  // R003 - Negative balance
  if (
    loan.currentBalance !== null &&
    loan.currentBalance !== undefined &&
    loan.currentBalance < 0
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "NEGATIVE_BALANCE",
        message: "Current balance cannot be negative",
        severity: "CRITICAL",
        field: "currentBalance",
        actualValue: loan.currentBalance,
        expectedValue: ">= 0"
      })
    );
  }

  // R004 - Balance greater than principal
  if (
    loan.currentBalance !== null &&
    loan.originalPrincipal !== null &&
    loan.currentBalance > loan.originalPrincipal &&
    loan.originalPrincipal >= 0
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "BALANCE_EXCEEDS_PRINCIPAL",
        message: "Current balance cannot exceed original principal",
        severity: "HIGH",
        field: "currentBalance",
        actualValue: loan.currentBalance,
        expectedValue: `<= ${loan.originalPrincipal}`
      })
    );
  }

  // R005 - Invalid interest rate
  if (
    loan.interestRate !== null &&
    loan.interestRate !== undefined &&
    (loan.interestRate < 0.1 || loan.interestRate > 40)
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "INVALID_INTEREST_RATE",
        message: "Interest rate must be between 0.1% and 40%",
        severity: "MEDIUM",
        field: "interestRate",
        actualValue: loan.interestRate,
        expectedValue: "0.1 - 40"
      })
    );
  }

  // R006 - Maturity before origination
  if (
    loan.originationDate &&
    loan.maturityDate &&
    loan.maturityDate <= loan.originationDate
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "MATURITY_BEFORE_ORIGINATION",
        message: "Maturity date must be after origination date",
        severity: "HIGH",
        field: "maturityDate",
        actualValue: loan.maturityDate,
        expectedValue: "> originationDate"
      })
    );
  }

  // R007 - Invalid payment status
  if (
    loan.paymentStatus &&
    !VALID_PAYMENT_STATUSES.includes(loan.paymentStatus)
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "INVALID_PAYMENT_STATUS",
        message: "Invalid payment status",
        severity: "MEDIUM",
        field: "paymentStatus",
        actualValue: loan.paymentStatus,
        expectedValue: VALID_PAYMENT_STATUSES
      })
    );
  }

  // R008 - Payment status vs DPD mismatch
  if (
    loan.paymentStatus === "CURRENT" &&
    loan.daysPastDue > 0
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "PAYMENT_STATUS_MISMATCH",
        message:
          "Payment status is CURRENT but days past due is greater than zero",
        severity: "HIGH",
        field: "paymentStatus",
        actualValue: `${loan.paymentStatus}, DPD: ${loan.daysPastDue}`,
        expectedValue: "CURRENT with DPD = 0"
      })
    );
  }

  if (
    loan.paymentStatus === "30+ DPD" &&
    loan.daysPastDue < 30
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "PAYMENT_STATUS_MISMATCH",
        message: "30+ DPD status requires at least 30 days past due",
        severity: "HIGH",
        field: "daysPastDue",
        actualValue: loan.daysPastDue,
        expectedValue: ">= 30"
      })
    );
  }

  if (
    loan.paymentStatus === "60+ DPD" &&
    loan.daysPastDue < 60
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "PAYMENT_STATUS_MISMATCH",
        message: "60+ DPD status requires at least 60 days past due",
        severity: "HIGH",
        field: "daysPastDue",
        actualValue: loan.daysPastDue,
        expectedValue: ">= 60"
      })
    );
  }

  if (
    loan.paymentStatus === "90+ DPD" &&
    loan.daysPastDue < 90
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "PAYMENT_STATUS_MISMATCH",
        message: "90+ DPD status requires at least 90 days past due",
        severity: "HIGH",
        field: "daysPastDue",
        actualValue: loan.daysPastDue,
        expectedValue: ">= 90"
      })
    );
  }

  // R009 - Missing document status
  if (!loan.documentStatus) {
    exceptions.push(
      createException(loan, {
        exceptionType: "MISSING_DOCUMENT_STATUS",
        message: "Document status is required",
        severity: "MEDIUM",
        field: "documentStatus",
        actualValue: loan.documentStatus
      })
    );
  }

  // R010 - Invalid borrower state
  if (
    loan.borrowerState &&
    !VALID_STATES.includes(loan.borrowerState)
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "INVALID_STATE",
        message: "Invalid borrower state code",
        severity: "MEDIUM",
        field: "borrowerState",
        actualValue: loan.borrowerState,
        expectedValue: VALID_STATES
      })
    );
  }

  // R011 - Closed loan with positive balance
  if (
    loan.paymentStatus === "CLOSED" &&
    loan.currentBalance > 0
  ) {
    exceptions.push(
      createException(loan, {
        exceptionType: "CLOSED_WITH_POSITIVE_BALANCE",
        message: "Closed loan should not have a positive balance",
        severity: "HIGH",
        field: "currentBalance",
        actualValue: loan.currentBalance,
        expectedValue: 0
      })
    );
  }

  // R012 - Stale record
  if (loan.lastUpdatedAt) {
    const ageInDays =
      (Date.now() - new Date(loan.lastUpdatedAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (ageInDays > STALE_RECORD_DAYS) {
      exceptions.push(
        createException(loan, {
          exceptionType: "STALE_RECORD",
          message:
            `Record has not been updated for more than ${STALE_RECORD_DAYS} days`,
          severity: "LOW",
          field: "lastUpdatedAt",
          actualValue: loan.lastUpdatedAt,
          expectedValue:
            `Updated within ${STALE_RECORD_DAYS} days`
        })
      );
    }
  }

  return exceptions;
};


// ============================================================
// Duplicate loan IDs
// ============================================================

const findDuplicateLoanIds = async () => {
  return Loan.aggregate([
    {
      $match: {
        loanId: {
          $exists: true,
          $ne: ""
        }
      }
    },
    {
      $group: {
        _id: "$loanId",
        count: { $sum: 1 },
        loanIds: { $push: "$_id" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);
};


// ============================================================
// Duplicate borrower + principal + origination date
// ============================================================

const findDuplicateBorrowerCombinations = async () => {
  return Loan.aggregate([
    {
      $match: {
        borrowerId: {
          $exists: true,
          $ne: ""
        },
        originalPrincipal: {
          $exists: true
        },
        originationDate: {
          $exists: true
        }
      }
    },
    {
      $group: {
        _id: {
          borrowerId: "$borrowerId",
          originalPrincipal: "$originalPrincipal",
          originationDate: "$originationDate"
        },
        count: { $sum: 1 },
        loanIds: { $push: "$_id" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);
};


// ============================================================
// Validate all loans
// ============================================================

const validateAllLoans = async () => {

  // Clear previous validation results
  // so validation can be run again safely.
  await Exception.deleteMany({});

  const loans = await Loan.find().lean();

  const allExceptions = [];
  const exceptionLoanIds = new Set();


  // ----------------------------------------
  // Individual loan validation
  // ----------------------------------------

  for (const loan of loans) {
    const exceptions = validateLoan(loan);

    if (exceptions.length > 0) {
      exceptionLoanIds.add(
        loan._id.toString()
      );

      allExceptions.push(
        ...exceptions
      );
    }
  }


  // ----------------------------------------
  // Duplicate loan ID validation
  // ----------------------------------------

  const duplicateLoanIds =
    await findDuplicateLoanIds();

  for (const duplicate of duplicateLoanIds) {

    for (const loanObjectId of duplicate.loanIds) {

      const loan = loans.find(
        (item) =>
          item._id.toString() ===
          loanObjectId.toString()
      );

      if (!loan) continue;

      exceptionLoanIds.add(
        loan._id.toString()
      );

      allExceptions.push(
        createException(loan, {

          exceptionType:
            "DUPLICATE_LOAN_ID",

          message:
            `Loan ID ${duplicate._id} appears ${duplicate.count} times`,

          severity:
            "CRITICAL",

          field:
            "loanId",

          actualValue:
            duplicate._id,

          expectedValue:
            "Unique loan ID"
        })
      );
    }
  }


  // ----------------------------------------
  // Duplicate borrower combination
  // ----------------------------------------

  const duplicateCombinations =
    await findDuplicateBorrowerCombinations();

  for (const duplicate of duplicateCombinations) {

    for (const loanObjectId of duplicate.loanIds) {

      const loan = loans.find(
        (item) =>
          item._id.toString() ===
          loanObjectId.toString()
      );

      if (!loan) continue;

      exceptionLoanIds.add(
        loan._id.toString()
      );

      allExceptions.push(
        createException(loan, {

          exceptionType:
            "DUPLICATE_BORROWER_COMBINATION",

          message:
            "Duplicate borrower + original principal + origination date combination",

          severity:
            "HIGH",

          field:
            "borrowerId",

          actualValue: {
            borrowerId:
              duplicate._id.borrowerId,

            originalPrincipal:
              duplicate._id.originalPrincipal,

            originationDate:
              duplicate._id.originationDate
          },

          expectedValue:
            "Unique combination"
        })
      );
    }
  }


  // ----------------------------------------
  // Bulk update validation statuses
  // ----------------------------------------

  const bulkOperations =
    loans.map((loan) => ({

      updateOne: {

        filter: {
          _id: loan._id
        },

        update: {
          $set: {

            validationStatus:
              exceptionLoanIds.has(
                loan._id.toString()
              )
                ? "EXCEPTION"
                : "VALID"

          }
        }
      }
    }));


  if (bulkOperations.length > 0) {
    await Loan.bulkWrite(
      bulkOperations
    );
  }


  // ----------------------------------------
  // Insert exceptions
  // ----------------------------------------

  if (allExceptions.length > 0) {
    await Exception.insertMany(
      allExceptions
    );
  }


  // ----------------------------------------
  // Summary
  // ----------------------------------------

  const validLoans =
    loans.length -
    exceptionLoanIds.size;


  const severitySummary =
    allExceptions.reduce(
      (summary, exception) => {

        summary[exception.severity] =
          (summary[exception.severity] || 0) + 1;

        return summary;

      },
      {}
    );


  const typeSummary =
    allExceptions.reduce(
      (summary, exception) => {

        summary[exception.exceptionType] =
          (summary[exception.exceptionType] || 0) + 1;

        return summary;

      },
      {}
    );


  // ----------------------------------------
  // Audit validation execution
  // ----------------------------------------

  await createAuditLog({

    action:
      "VALIDATION_EXECUTED",

    actor:
      "SYSTEM",

    details: {

      totalLoans:
        loans.length,

      validLoans,

      exceptionLoans:
        exceptionLoanIds.size,

      totalExceptions:
        allExceptions.length
    }
  });


  return {

    totalLoans:
      loans.length,

    validLoans,

    exceptionLoans:
      exceptionLoanIds.size,

    totalExceptions:
      allExceptions.length,

    severitySummary,

    typeSummary
  };
};


module.exports = {
  validateLoan,
  validateAllLoans
};