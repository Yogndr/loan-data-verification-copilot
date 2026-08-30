const fs = require("fs");
const path = require("path");
const { faker } = require("@faker-js/faker");

const DATA_DIR = path.join(__dirname, "../../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TOTAL_LOANS = 5000;

const STATES = [
  "DL", "MH", "KA", "TN", "GJ",
  "UP", "RJ", "WB", "HR", "TS",
  "KL", "MP", "PB", "AP", "BR"
];

const LOAN_TYPES = [
  "PERSONAL",
  "AUTO",
  "HOME",
  "EDUCATION",
  "BUSINESS"
];

const LOAN_PURPOSES = [
  "DEBT_CONSOLIDATION",
  "HOME_IMPROVEMENT",
  "VEHICLE",
  "EDUCATION",
  "WORKING_CAPITAL"
];

const CREDIT_GRADES = ["A", "B", "C", "D", "E"];

const SERVICERS = [
  "ServicerA",
  "ServicerB",
  "ServicerC"
];

const SOURCE_SYSTEMS = [
  "ORIGINATION_SYSTEM",
  "SERVICING_SYSTEM",
  "MANUAL_UPLOAD"
];

const PAYMENT_STATUSES = [
  "CURRENT",
  "30+ DPD",
  "60+ DPD",
  "90+ DPD",
  "CLOSED"
];

function randomDate(start, end) {
  return faker.date.between({
    from: start,
    to: end
  });
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function convertToCSV(rows) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(",")
    )
  ];

  return lines.join("\n");
}

// --------------------------------------------------
// Generate primary loan tape
// --------------------------------------------------

const loans = [];

for (let i = 0; i < TOTAL_LOANS; i++) {
  const loanId = `LN-${10000 + i}`;
  const borrowerId = `BR-${20000 + faker.number.int({ min: 0, max: 3999 })}`;

  const originationDate = randomDate(
    new Date("2018-01-01"),
    new Date("2025-06-30")
  );

  const termMonths = faker.helpers.arrayElement([
    12, 24, 36, 48, 60, 72, 84, 120, 180, 240, 360
  ]);

  const maturityDate = new Date(originationDate);

  maturityDate.setMonth(
    maturityDate.getMonth() + termMonths
  );

  const originalPrincipal = faker.helpers.arrayElement([
    50000,
    75000,
    100000,
    150000,
    200000,
    250000,
    300000,
    500000,
    750000,
    1000000
  ]);

  const currentBalance = Number(
    (
      originalPrincipal *
      faker.number.float({
        min: 0.05,
        max: 0.95,
        fractionDigits: 2
      })
    ).toFixed(2)
  );

  const interestRate = Number(
    faker.number.float({
      min: 5,
      max: 18,
      fractionDigits: 2
    }).toFixed(2)
  );

  const daysPastDue = faker.helpers.arrayElement([
    0, 0, 0, 0, 15, 30, 45, 60, 90, 120
  ]);

  let paymentStatus = "CURRENT";

  if (daysPastDue > 0 && daysPastDue <= 30) {
    paymentStatus = "30+ DPD";
  } else if (daysPastDue <= 60 && daysPastDue > 30) {
    paymentStatus = "60+ DPD";
  } else if (daysPastDue > 60) {
    paymentStatus = "90+ DPD";
  }

  const lastUpdated = faker.date.between({
    from: new Date("2026-02-01"),
    to: new Date("2026-08-20")
  });

  loans.push({
    loan_id: loanId,
    borrower_id: borrowerId,
    loan_type: faker.helpers.arrayElement(LOAN_TYPES),
    origination_date: formatDate(originationDate),
    maturity_date: formatDate(maturityDate),
    original_principal: originalPrincipal,
    current_balance: currentBalance,
    interest_rate: interestRate,
    term_months: termMonths,
    borrower_state: faker.helpers.arrayElement(STATES),
    loan_purpose: faker.helpers.arrayElement(LOAN_PURPOSES),
    credit_grade: faker.helpers.arrayElement(CREDIT_GRADES),
    employment_length: faker.helpers.arrayElement([
      "<1",
      "1-3",
      "4-6",
      "7-10",
      "10+"
    ]),
    income_band: faker.helpers.arrayElement([
      "LOW",
      "MEDIUM",
      "HIGH",
      "VERY_HIGH"
    ]),
    payment_status: paymentStatus,
    days_past_due: daysPastDue,
    servicer_name: faker.helpers.arrayElement(SERVICERS),
    last_payment_date: formatDate(
      faker.date.between({
        from: new Date("2025-01-01"),
        to: new Date("2026-08-20")
      })
    ),
    last_updated_at: formatDate(lastUpdated),
    document_status: faker.helpers.arrayElement([
      "AVAILABLE",
      "MISSING",
      "PENDING"
    ]),
    source_system: faker.helpers.arrayElement(SOURCE_SYSTEMS)
  });
}

// --------------------------------------------------
// Inject intentional data-quality issues
// --------------------------------------------------

const expectedExceptions = [];

// 1. Missing loan IDs
for (let i = 0; i < 5; i++) {
  loans[i].loan_id = "";

  expectedExceptions.push({
    loan_id: "",
    exception_type: "MISSING_LOAN_ID",
    severity: "CRITICAL"
  });
}

// 2. Duplicate loan IDs
for (let i = 100; i < 105; i++) {
  loans[i + 1].loan_id = loans[i].loan_id;

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "DUPLICATE_LOAN_ID",
    severity: "CRITICAL"
  });
}

// 3. Negative principal
for (let i = 200; i < 205; i++) {
  loans[i].original_principal = -50000;

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "NEGATIVE_PRINCIPAL",
    severity: "CRITICAL"
  });
}

// 4. Negative balance
for (let i = 210; i < 215; i++) {
  loans[i].current_balance = -1000;

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "NEGATIVE_BALANCE",
    severity: "CRITICAL"
  });
}

// 5. Invalid dates
for (let i = 300; i < 305; i++) {
  loans[i].origination_date = "INVALID_DATE";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "INVALID_DATE",
    severity: "HIGH"
  });
}

// 6. Maturity before origination
for (let i = 310; i < 315; i++) {
  loans[i].maturity_date = "2017-01-01";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "MATURITY_BEFORE_ORIGINATION",
    severity: "HIGH"
  });
}

// 7. Current balance > original principal
for (let i = 400; i < 408; i++) {
  loans[i].current_balance =
    loans[i].original_principal + 50000;

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "BALANCE_EXCEEDS_PRINCIPAL",
    severity: "HIGH"
  });
}

// 8. Invalid interest rates
for (let i = 500; i < 505; i++) {
  loans[i].interest_rate = 75;

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "INVALID_INTEREST_RATE",
    severity: "MEDIUM"
  });
}

// 9. Payment status / DPD mismatch
for (let i = 600; i < 606; i++) {
  loans[i].days_past_due = 90;
  loans[i].payment_status = "CURRENT";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "PAYMENT_STATUS_MISMATCH",
    severity: "HIGH"
  });
}

// 10. Missing document status
for (let i = 700; i < 705; i++) {
  loans[i].document_status = "";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "MISSING_DOCUMENT_STATUS",
    severity: "MEDIUM"
  });
}

// 11. Stale records
for (let i = 800; i < 806; i++) {
  loans[i].last_updated_at = "2023-01-15";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "STALE_RECORD",
    severity: "MEDIUM"
  });
}

// 12. Invalid states
for (let i = 900; i < 905; i++) {
  loans[i].borrower_state = "XX";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "INVALID_STATE",
    severity: "MEDIUM"
  });
}

// 13. Closed loan with positive balance
for (let i = 1000; i < 1005; i++) {
  loans[i].payment_status = "CLOSED";
  loans[i].current_balance = 50000;

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "CLOSED_WITH_POSITIVE_BALANCE",
    severity: "HIGH"
  });
}

// 14. Suspicious repeated borrower
for (let i = 1100; i < 1112; i++) {
  loans[i].borrower_id = "BR-SUSPICIOUS-001";

  expectedExceptions.push({
    loan_id: loans[i].loan_id,
    exception_type: "SUSPICIOUS_REPEATED_BORROWER",
    severity: "MEDIUM"
  });
}

// --------------------------------------------------
// Generate servicer updates
// --------------------------------------------------

const servicerUpdates = [];

for (let i = 0; i < loans.length; i += 17) {
  const loan = loans[i];

  if (!loan.loan_id) continue;

  servicerUpdates.push({
    loan_id: loan.loan_id,
    current_balance: loan.current_balance,
    interest_rate: loan.interest_rate,
    payment_status: loan.payment_status,
    days_past_due: loan.days_past_due,
    last_updated_at: loan.last_updated_at,
    servicer_name: loan.servicer_name
  });
}

// Inject source conflicts
for (let i = 1200; i < 1300; i++) {
  const loan = loans[i];

  if (!loan.loan_id) continue;

  servicerUpdates.push({
    loan_id: loan.loan_id,
    current_balance: loan.original_principal * 0.25,
    interest_rate: 9.75,
    payment_status: "30+ DPD",
    days_past_due: 30,
    last_updated_at: "2026-08-25",
    servicer_name: "ServicerB"
  });

  expectedExceptions.push({
    loan_id: loan.loan_id,
    exception_type: "SOURCE_CONFLICT",
    severity: "HIGH"
  });
}

// --------------------------------------------------
// Document manifest
// --------------------------------------------------

const documentManifest = loans
  .filter((loan) => loan.loan_id)
  .map((loan) => ({
    loan_id: loan.loan_id,
    application_document: faker.helpers.arrayElement([
      "AVAILABLE",
      "MISSING"
    ]),
    income_document: faker.helpers.arrayElement([
      "AVAILABLE",
      "MISSING"
    ]),
    identity_document: faker.helpers.arrayElement([
      "AVAILABLE",
      "MISSING"
    ]),
    document_status: loan.document_status || "MISSING"
  }));

// --------------------------------------------------
// Validation rules
// --------------------------------------------------

const validationRules = {
  required_fields: [
    "loan_id",
    "borrower_id",
    "origination_date",
    "original_principal",
    "current_balance"
  ],

  numeric_ranges: {
    interest_rate: {
      min: 0.1,
      max: 40
    }
  },

  rules: [
    {
      id: "R001",
      name: "Required fields present",
      severity: "CRITICAL"
    },
    {
      id: "R002",
      name: "Unique loan ID",
      severity: "CRITICAL"
    },
    {
      id: "R003",
      name: "Valid dates",
      severity: "HIGH"
    },
    {
      id: "R004",
      name: "Maturity after origination",
      severity: "HIGH"
    },
    {
      id: "R005",
      name: "Non-negative principal and balance",
      severity: "CRITICAL"
    },
    {
      id: "R006",
      name: "Current balance <= original principal",
      severity: "HIGH"
    },
    {
      id: "R007",
      name: "Interest rate within expected range",
      severity: "MEDIUM"
    },
    {
      id: "R008",
      name: "Payment status consistent with DPD",
      severity: "HIGH"
    },
    {
      id: "R009",
      name: "Document status present",
      severity: "MEDIUM"
    },
    {
      id: "R010",
      name: "Stale record detection",
      severity: "MEDIUM"
    },
    {
      id: "R011",
      name: "Valid borrower state",
      severity: "MEDIUM"
    },
    {
      id: "R012",
      name: "Closed loan has zero balance",
      severity: "HIGH"
    }
  ]
};

// --------------------------------------------------
// Demo users
// --------------------------------------------------

const users = [
  {
    name: "Aarav Operator",
    email: "operator@demo.local",
    role: "DATA_OPERATOR"
  },
  {
    name: "Meera Reviewer",
    email: "reviewer@demo.local",
    role: "REVIEWER"
  },
  {
    name: "Kabir Consumer",
    email: "consumer@demo.local",
    role: "DATA_CONSUMER"
  }
];

// --------------------------------------------------
// Write files
// --------------------------------------------------

fs.writeFileSync(
  path.join(DATA_DIR, "loan_tape.csv"),
  convertToCSV(loans)
);

fs.writeFileSync(
  path.join(DATA_DIR, "servicer_update.csv"),
  convertToCSV(servicerUpdates)
);

fs.writeFileSync(
  path.join(DATA_DIR, "document_manifest.csv"),
  convertToCSV(documentManifest)
);

fs.writeFileSync(
  path.join(DATA_DIR, "validation_rules.json"),
  JSON.stringify(validationRules, null, 2)
);

fs.writeFileSync(
  path.join(DATA_DIR, "users.json"),
  JSON.stringify(users, null, 2)
);

fs.writeFileSync(
  path.join(DATA_DIR, "expected_exception_sample.csv"),
  convertToCSV(expectedExceptions.slice(0, 30))
);

console.log("======================================");
console.log("Synthetic dataset generated");
console.log("======================================");
console.log(`Loans: ${loans.length}`);
console.log(`Servicer updates: ${servicerUpdates.length}`);
console.log(`Document records: ${documentManifest.length}`);
console.log(`Known exceptions: ${expectedExceptions.length}`);
console.log(`Output directory: ${DATA_DIR}`);
console.log("======================================");