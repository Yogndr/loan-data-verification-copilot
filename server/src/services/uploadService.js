
const fs = require("fs");
const csv = require("csv-parse/sync");

const Upload = require("../models/Upload");
const Loan = require("../models/Loan");

// Safely parse dates.
// Invalid dates are stored as null so the validation engine
// can identify them instead of the record being rejected.
const parseDate = (value) => {
  if (!value || value.trim() === "") {
    return null;
  }

  const date = new Date(value);

  return isNaN(date.getTime()) ? null : date;
};

const importLoanCSV = async (file, userId) => {
  const fileContent = fs.readFileSync(file.path, "utf-8");

  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const upload = await Upload.create({
    fileName: file.originalname,
    source: "CSV",
    uploadedBy: userId || null,
    totalRows: records.length,
    status: "PROCESSING",
  });

  const loans = [];
  const failedRows = [];

  records.forEach((record, index) => {
    try {
      const loan = {
        loanId: record.loan_id || "",
        borrowerId: record.borrower_id || "",
        loanType: record.loan_type || "",

        originationDate: parseDate(record.origination_date),
        maturityDate: parseDate(record.maturity_date),

        originalPrincipal: Number(record.original_principal) || 0,
        currentBalance: Number(record.current_balance) || 0,
        interestRate: Number(record.interest_rate) || 0,
        termMonths: Number(record.term_months) || 0,

        borrowerState: record.borrower_state || "",
        loanPurpose: record.loan_purpose || "",
        creditGrade: record.credit_grade || "",
        employmentLength: record.employment_length || "",
        incomeBand: record.income_band || "",

        paymentStatus: record.payment_status || "",
        daysPastDue: Number(record.days_past_due) || 0,

        servicerName: record.servicer_name || "",

        lastPaymentDate: parseDate(record.last_payment_date),
        lastUpdatedAt: parseDate(record.last_updated_at),

        documentStatus: record.document_status || "",
        sourceSystem: record.source_system || "",

        sourceFile: upload._id,
      };

      loans.push(loan);
    } catch (error) {
      failedRows.push({
        row: index + 2,
        error: error.message,
      });
    }
  });

  if (loans.length > 0) {
    await Loan.insertMany(loans, {
      ordered: false,
    });
  }

  upload.successfulRows = loans.length;
  upload.failedRows = failedRows.length;
  upload.status = "COMPLETED";

  await upload.save();

  return {
    uploadId: upload._id,
    fileName: upload.fileName,
    totalRows: records.length,
    successfulRows: loans.length,
    failedRows: failedRows.length,
    failures: failedRows,
  };
};

module.exports = {
  importLoanCSV,
};

