<!-- # React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project. -->

# Loan Data Verification Copilot

An AI-assisted full-stack loan data verification system that ingests loan records, validates data quality, identifies exceptions, provides AI-assisted recommendations, maintains an auditable history, and cryptographically seals verified loan records.

## 1. Overview

Financial loan data can arrive from CSV exports, servicing systems, APIs, or manually maintained spreadsheets and often contains missing, inconsistent, duplicated, stale, or invalid values.

The **Loan Data Verification Copilot** provides a centralized workflow to:

* Import loan records from CSV
* Normalize and store loan data
* Run configurable validation rules
* Detect and classify data-quality exceptions
* Review exceptions manually
* Generate AI-powered recommendations using Google Gemini
* Accept or reject AI recommendations
* Verify resolved loan records
* Generate SHA-256 record hashes
* Maintain a tamper-evident audit trail
* View dashboard-level verification statistics
* Export verified loan records

---

# 2. Key Features

## Data Ingestion

* CSV-based loan data ingestion
* Multipart file upload using Multer
* File size validation
* Bulk loan record import
* Supports large datasets such as the provided 5,000-record dataset
* Stores source file references with imported records

## Data Validation

The validation engine checks loan records against multiple business rules.

Implemented validation rules include:

| Rule | Validation                                                    |
| ---- | ------------------------------------------------------------- |
| R001 | Missing required fields                                       |
| R002 | Negative original principal                                   |
| R003 | Negative current balance                                      |
| R004 | Current balance exceeds original principal                    |
| R005 | Invalid interest rate                                         |
| R006 | Maturity date before origination date                         |
| R007 | Invalid payment status                                        |
| R008 | Payment status and days-past-due mismatch                     |
| R009 | Missing document status                                       |
| R010 | Invalid borrower state                                        |
| R011 | Closed loan with positive balance                             |
| R012 | Stale loan record                                             |
| R013 | Duplicate loan ID                                             |
| R014 | Duplicate borrower + principal + origination-date combination |

Each detected issue is stored as an exception with:

* Exception type
* Severity
* Field
* Actual value
* Expected value
* Status
* Reviewer comment
* Associated loan

Exceptions are categorized into:

* LOW
* MEDIUM
* HIGH
* CRITICAL

---

# 3. Exception Management

The application provides an exception-management workflow.

Reviewers can:

* View all exceptions
* Filter by severity
* Filter by status
* Filter by loan ID
* View individual exception details
* Approve exceptions
* Reject exceptions
* Request corrections
* Add reviewer comments
* Review AI recommendations

Exception statuses include:

* OPEN
* IN_REVIEW
* CORRECTED
* APPROVED
* REJECTED

Pagination is implemented for exception listing.

---

# 4. AI-Assisted Review

Google Gemini is integrated into the application to assist reviewers in analyzing loan validation exceptions.

For an exception, the AI receives relevant exception and loan information including:

* Exception type
* Exception message
* Severity
* Field
* Actual value
* Expected value
* Loan ID
* Borrower ID
* Loan type
* Principal
* Current balance
* Payment status
* Days past due
* Borrower state
* Document status

The AI generates:

* Issue explanation
* Why the issue matters
* Recommended action
* Suggested value when a valid correction can be determined
* Confidence level

Confidence levels:

* HIGH
* MEDIUM
* LOW

The AI response is stored as an `AIReview` record for traceability.

### Human-in-the-loop AI workflow

The reviewer remains responsible for the final decision.

Supported AI decisions:

* ACCEPTED
* REJECTED
* EDITED

This prevents the AI from independently modifying or approving loan records without reviewer involvement.

---

# 5. Verified Loan Records

After exceptions are resolved, a loan can be verified.

The verification workflow:

1. Finds the loan.
2. Checks for unresolved exceptions.
3. Prevents verification when OPEN or IN_REVIEW exceptions remain.
4. Creates a canonical verified loan record.
5. Stores the relevant canonical loan fields.
6. Generates a SHA-256 record hash.
7. Stores the verification timestamp.
8. Records reviewer information.
9. Marks the loan as `VALID`.
10. Creates an audit event.

The canonical verified record is stored separately from the original loan record using the `VerifiedLoan` model.

---

# 6. Cryptographic Record Integrity

Verified loan records are cryptographically sealed using SHA-256.

The record hash is generated from canonical loan fields including:

* Loan ID
* Borrower ID
* Original principal
* Current balance
* Interest rate
* Payment status
* Previous audit hash

The previous audit hash is included when generating the next record hash.

This creates a chained integrity mechanism:

```text
GENESIS_HASH
      ↓
Audit Record 1
      ↓
Audit Record 2
      ↓
Audit Record 3
      ↓
Verified Loan Record
```

The purpose is to make changes to the audit history detectable.

---

# 7. Audit Trail

Important system events are recorded in the audit log.

Examples include:

* File uploaded
* Loan imported
* Validation executed
* Exception created
* AI recommendation generated
* Reviewer actions
* Verified record created
* Verified records exported

Each audit entry contains:

* Loan reference
* Upload reference
* Action
* Actor
* Details
* Metadata
* Previous hash
* Current hash
* Timestamp

The `currentHash` is calculated using SHA-256 and the previous audit hash.

Audit records can be viewed through the application.

---

# 8. Dashboard

The dashboard provides an overview of the verification pipeline.

Displayed metrics include:

* Total loans
* Valid loans
* Loans containing exceptions
* Total exceptions
* Exception severity summary
* Exception type summary

This gives reviewers a quick overview of overall data quality.

---

# 9. Verified Loan Export

Verified loan records can be exported from the application.

Supported formats:

* JSON
* CSV

The CSV export includes important verification information such as:

* Loan ID
* Borrower ID
* Original principal
* Current balance
* Interest rate
* Payment status
* Record hash
* Verification timestamp

---

# 10. Technology Stack

## Frontend

* React
* React Router
* JavaScript
* HTML
* CSS

## Backend

* Node.js
* Express.js
* REST APIs
* Multer

## Database

* MongoDB
* Mongoose

## AI

* Google Gemini API

## Security / Integrity

* SHA-256 cryptographic hashing

---

# 11. Application Architecture

```text
                    ┌─────────────────────┐
                    │     React UI        │
                    │                     │
                    │ Dashboard            │
                    │ Exceptions           │
                    │ Loan Details         │
                    │ Audit Trail / Export │
                    │ Upload               │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │                     │
                    │ Controllers         │
                    │ Routes              │
                    │ Validation          │
                    │ AI Services         │
                    │ Verification        │
                    │ Audit Service       │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌───────────┐ ┌────────────┐ ┌────────────┐
          │ MongoDB   │ │ Gemini API │ │ SHA-256    │
          │           │ │            │ │ Hashing    │
          └───────────┘ └────────────┘ └────────────┘
```

---

# 12. Main API Endpoints

## Health

```http
GET /api/health
```

Checks whether the backend is running.

## Upload

```http
POST /api/uploads
```

Uploads a loan CSV file.

Form-data:

```text
file: <CSV file>
```

## Validation

```http
POST /api/validation/run
```

Runs validation across imported loan records.

```http
GET /api/validation/count
```

Returns the number of imported loans.

## Exceptions

```http
GET /api/exceptions
```

Returns exceptions with pagination and filtering.

Optional query parameters:

```text
severity
status
loanId
page
limit
```

```http
GET /api/exceptions/:id
```

Returns a specific exception.

```http
PATCH /api/exceptions/:id/review
```

Reviews an exception.

Example:

```json
{
  "action": "APPROVE",
  "comment": "Reviewed and approved."
}
```

```http
POST /api/exceptions/:id/ai-recommendation
```

Generates an AI recommendation.

## AI

```http
POST /api/ai/exceptions/:exceptionId/analyze
```

Generates AI analysis for an exception.

```http
POST /api/ai/exceptions/:exceptionId/decision
```

Records the reviewer's decision.

Example:

```json
{
  "decision": "ACCEPTED"
}
```

Supported decisions:

```text
ACCEPTED
REJECTED
EDITED
```

## Loans

```http
GET /api/loans/:id
```

Returns loan details.

```http
POST /api/loans/:id/verify
```

Verifies and cryptographically seals a resolved loan.

```http
GET /api/loans/export
```

Exports verified loan records.

Examples:

```text
/api/loans/export?format=json
/api/loans/export?format=csv
```

```http
GET /api/loans/audit-trail
```

Returns audit information.

## Audit

```http
GET /api/audit/:loanId
```

Returns the audit trail for a specific loan.

---

# 13. Frontend Pages

The application provides the following main screens:

### Dashboard

Provides overall loan and exception statistics.

### Exceptions

Provides exception filtering, pagination, review workflow and AI-assisted analysis.

### Loan Details

Displays individual loan information and verification functionality.

### Audit Trail & Export

Provides audit information and verified-record export functionality.

### Upload

Provides CSV upload functionality for importing loan records.

---

# 14. Environment Variables

Create a `.env` file in the backend/server directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit real credentials to GitHub.

Add `.env` to `.gitignore`.

Example:

```gitignore
node_modules/
.env
uploads/
```

---

# 15. Installation

## Clone the repository

```bash
git clone <your-github-repository-url>
cd <project-folder>
```

## Backend

```bash
cd server
npm install
```

Create the `.env` file and configure MongoDB and Gemini credentials.

Start the backend:

```bash
npm start
```

or, if using nodemon:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

## Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The React application will run on the Vite development URL shown in the terminal.

---

# 16. End-to-End Workflow

The intended workflow is:

```text
CSV Upload
    ↓
Loan Import
    ↓
Run Validation
    ↓
Validation Rules
    ↓
Exceptions Created
    ↓
Reviewer Opens Exception
    ↓
AI Recommendation
    ↓
Human Review / Decision
    ↓
Exceptions Resolved
    ↓
Loan Verification
    ↓
Canonical VerifiedLoan
    ↓
SHA-256 Record Hash
    ↓
Audit Log
    ↓
Verified Loan Export
```

---

# 17. Example Validation Result

For a dataset containing 5,000 loan records, the system can import the records and subsequently run the validation engine to identify records requiring review.

The validation response provides:

```json
{
  "totalLoans": 5000,
  "validLoans": 0,
  "exceptionLoans": 0,
  "totalExceptions": 0
}
```

The actual values depend on the dataset and the validation rules triggered during execution.

---

# 18. Design Principles

### Traceability

Each exception is associated with its source loan, and important processing events are recorded in the audit log.

### Human-in-the-loop AI

AI recommendations assist reviewers but do not replace reviewer decisions.

### Data Integrity

Verified records are separated from raw loan data and protected with cryptographic hashes.

### Repeatable Validation

The validation engine clears previous generated exceptions before executing a fresh validation run, allowing the dataset to be revalidated safely.

### Explainability

AI recommendations contain an explanation, reasoning, recommended action, suggested value where appropriate, and confidence level.

---

# 19. Challenge Requirement Mapping

| Challenge Requirement   | Implementation                                        |
| ----------------------- | ----------------------------------------------------- |
| Loan data ingestion     | CSV upload + bulk import                              |
| Data normalization      | Loan model and import service                         |
| Validation engine       | Rule-based validation service                         |
| Data-quality exceptions | Exception model and exception APIs                    |
| Exception severity      | LOW / MEDIUM / HIGH / CRITICAL                        |
| Exception review        | Reviewer actions and comments                         |
| AI-assisted review      | Google Gemini integration                             |
| AI recommendation       | Issue, reasoning, action, suggested value, confidence |
| Human-in-the-loop       | ACCEPTED / REJECTED / EDITED decisions                |
| Verified records        | VerifiedLoan model                                    |
| Record integrity        | SHA-256 hashing                                       |
| Auditability            | AuditLog + chained hashes                             |
| Dashboard               | Loan and exception summary                            |
| Traceability            | Loan → Exception → AI Review → Verification → Audit   |
| API design              | RESTful Express endpoints                             |
| Export                  | JSON / CSV verified loan export                       |
| Frontend console        | React-based dashboard and review screens              |

---

# 20. Security Notes

* API credentials are stored using environment variables.
* `.env` should not be committed to source control.
* Uploaded files should not contain sensitive production customer information.
* AI prompts instruct the model not to invent facts that are not present in the supplied loan data.
* Human reviewer decisions are explicitly recorded.

---

# 21. Future Improvements

Potential production improvements include:

* Authentication and role-based access control
* User management
* More granular reviewer permissions
* Production-grade file storage
* Background processing for very large datasets
* Stronger audit-chain verification endpoints
* Automated test coverage
* Cloud deployment
* Monitoring and observability
* More advanced normalization and source-system reconciliation

---

# 22. Submission

This project was developed as part of the **Intain Campus FinTech Challenge 2026 – Full Stack Track**.

The project demonstrates an end-to-end workflow for transforming messy loan records into validated, traceable and trusted loan data using rule-based validation, human review, AI assistance, audit logging and cryptographic record integrity.
