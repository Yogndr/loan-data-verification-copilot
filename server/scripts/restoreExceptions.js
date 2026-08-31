
require("dotenv").config();

const mongoose = require("mongoose");

const Loan = require("../src/models/Loan");
const Exception = require("../src/models/Exception");

const restoreExceptions = async () => {
  try {
    // ------------------------------------------------------------
    // Connect to MongoDB
    // ------------------------------------------------------------

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from server/.env"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // ------------------------------------------------------------
    // Get existing loans
    // ------------------------------------------------------------

    const loans = await Loan.find().lean();

    console.log(`Found ${loans.length} loans`);

    if (loans.length === 0) {
      throw new Error(
        "No loans found. Please upload/import the loan data first."
      );
    }

    // ------------------------------------------------------------
    // Remove existing exceptions
    // ------------------------------------------------------------

    await Exception.deleteMany({});

    console.log("Old exceptions removed");

    // ------------------------------------------------------------
    // Create demo exceptions
    // ------------------------------------------------------------

    const exceptions = [];

    /*
     * We create exceptions against REAL Loan documents.
     *
     * Therefore:
     *
     * exception.loanId = loan._id
     *
     * This allows:
     *
     * Exceptions
     *     ↓
     * View Loan
     *     ↓
     * Loan Details
     *     ↓
     * AI Copilot
     */

    for (let i = 0; i < loans.length; i++) {
      const loan = loans[i];

      // ----------------------------------------------------------
      // Invalid borrower state
      // ----------------------------------------------------------

      if (i % 100 === 0) {
        exceptions.push({
          loanId: loan._id,

          exceptionType: "INVALID_STATE",

          message: "Invalid borrower state code",

          severity: "MEDIUM",

          status: "OPEN",

          field: "borrowerState",

          actualValue:
            loan.borrowerState || "KL",

          expectedValue:
            "AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY,DC",

          source: "VALIDATION_ENGINE",
        });
      }

      // ----------------------------------------------------------
      // Invalid interest rate
      // ----------------------------------------------------------

      if (i % 150 === 0) {
        exceptions.push({
          loanId: loan._id,

          exceptionType:
            "INVALID_INTEREST_RATE",

          message:
            "Interest rate must be between 0.1% and 40%",

          severity: "MEDIUM",

          status: "OPEN",

          field: "interestRate",

          actualValue:
            loan.interestRate !== undefined &&
            loan.interestRate !== null
              ? loan.interestRate
              : 45,

          expectedValue: "0.1 - 40",

          source: "VALIDATION_ENGINE",
        });
      }

      // ----------------------------------------------------------
      // Balance exceeds principal
      // ----------------------------------------------------------

      if (i % 250 === 0) {
        exceptions.push({
          loanId: loan._id,

          exceptionType:
            "BALANCE_EXCEEDS_PRINCIPAL",

          message:
            "Current balance cannot exceed original principal",

          severity: "HIGH",

          status: "OPEN",

          field: "currentBalance",

          actualValue:
            loan.currentBalance !== undefined &&
            loan.currentBalance !== null
              ? loan.currentBalance
              : 150000,

          expectedValue:
            `<= ${
              loan.originalPrincipal !== undefined &&
              loan.originalPrincipal !== null
                ? loan.originalPrincipal
                : 100000
            }`,

          source: "VALIDATION_ENGINE",
        });
      }

      // ----------------------------------------------------------
      // Missing document status
      // ----------------------------------------------------------

      if (i % 350 === 0) {
        exceptions.push({
          loanId: loan._id,

          exceptionType:
            "MISSING_DOCUMENT_STATUS",

          message:
            "Document status is required",

          severity: "MEDIUM",

          status: "OPEN",

          field: "documentStatus",

          actualValue:
            loan.documentStatus || null,

          expectedValue:
            "Document status must be present",

          source: "VALIDATION_ENGINE",
        });
      }

      // ----------------------------------------------------------
      // Payment status mismatch
      // ----------------------------------------------------------

      if (i % 500 === 0) {
        exceptions.push({
          loanId: loan._id,

          exceptionType:
            "PAYMENT_STATUS_MISMATCH",

          message:
            "Payment status is CURRENT but days past due is greater than zero",

          severity: "HIGH",

          status: "OPEN",

          field: "paymentStatus",

          actualValue:
            `${loan.paymentStatus || "CURRENT"}, DPD: ${
              loan.daysPastDue || 30
            }`,

          expectedValue:
            "CURRENT with DPD = 0",

          source: "VALIDATION_ENGINE",
        });
      }
    }

    // ------------------------------------------------------------
    // Insert exceptions
    // ------------------------------------------------------------

    if (exceptions.length > 0) {
      await Exception.insertMany(exceptions);
    }

    console.log(
      `Successfully created ${exceptions.length} exceptions`
    );

    // ------------------------------------------------------------
    // Verify populated loan references
    // ------------------------------------------------------------

    const sample =
      await Exception.find()
        .populate("loanId")
        .limit(10)
        .lean();

    console.log("\nSample restored exceptions:");

    sample.forEach((exception) => {
      console.log({
        exceptionId:
          exception._id?.toString(),

        mongoLoanId:
          exception.loanId?._id?.toString(),

        loanId:
          exception.loanId?.loanId,

        exceptionType:
          exception.exceptionType,

        severity:
          exception.severity,

        status:
          exception.status,
      });
    });

    // ------------------------------------------------------------
    // Disconnect
    // ------------------------------------------------------------

    await mongoose.disconnect();

    console.log("\nException restoration completed successfully.");

    process.exit(0);
  } catch (error) {
    console.error(
      "\nException restoration failed:"
    );

    console.error(error);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
};

restoreExceptions();

