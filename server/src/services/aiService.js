
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Exception = require("../models/Exception");
const AIReview = require("../models/AIReview");
const { createAuditLog } = require("./auditService");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const generateExceptionRecommendation = async ({
  exception,
  loan,
}) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
  });

  const prompt = `
You are an AI assistant for a financial loan data verification system.

Analyze the following loan validation exception.

Exception:
- Type: ${exception.exceptionType}
- Message: ${exception.message}
- Severity: ${exception.severity}
- Field: ${exception.field}
- Actual Value: ${JSON.stringify(exception.actualValue)}
- Expected Value: ${JSON.stringify(exception.expectedValue)}

Loan:
- Loan ID: ${loan.loanId}
- Borrower ID: ${loan.borrowerId}
- Loan Type: ${loan.loanType}
- Original Principal: ${loan.originalPrincipal}
- Current Balance: ${loan.currentBalance}
- Payment Status: ${loan.paymentStatus}
- Days Past Due: ${loan.daysPastDue}
- Borrower State: ${loan.borrowerState}
- Document Status: ${loan.documentStatus}

Provide a concise review containing:

1. Issue
2. Why it matters
3. Recommended action
4. Suggested value, ONLY if the expected value clearly provides a valid correction
5. Confidence level

Do not invent facts that are not present in the provided data.

Return ONLY valid JSON:

{
  "issue": "...",
  "whyItMatters": "...",
  "recommendedAction": "...",
  "suggestedValue": null,
  "confidence": "HIGH|MEDIUM|LOW"
}
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanedText);
};


/**
 * Apply the reviewer's decision to an AI recommendation.
 */
const applyAIRecommendation = async (exceptionId, decision) => {
  if (!["ACCEPTED", "REJECTED", "EDITED"].includes(decision)) {
    throw new Error(
      "Invalid decision. Must be ACCEPTED, REJECTED, or EDITED"
    );
  }

  const exception = await Exception.findById(exceptionId);

  if (!exception) {
    throw new Error("Exception not found");
  }

  if (!exception.aiReview) {
    throw new Error("No AI recommendation exists for this exception");
  }

  const aiReview = await AIReview.findById(exception.aiReview);

  if (!aiReview) {
    throw new Error("AI review not found");
  }

  // Save reviewer decision
  aiReview.decision = decision;

  await aiReview.save();

  // Update exception status
  if (decision === "ACCEPTED") {
    exception.status = "APPROVED";
    exception.reviewerComment =
      "AI recommendation accepted by reviewer.";
  }

  if (decision === "REJECTED") {
    exception.status = "IN_REVIEW";
    exception.reviewerComment =
      "AI recommendation dismissed by reviewer.";
  }

  if (decision === "EDITED") {
    exception.status = "IN_REVIEW";
    exception.reviewerComment =
      "AI recommendation edited by reviewer.";
  }

  await exception.save();

  // Create audit trail
  await createAuditLog({
    loanId: exception.loanId,
    action:
      decision === "ACCEPTED"
        ? "EXCEPTION_APPROVED"
        : decision === "REJECTED"
        ? "EXCEPTION_REJECTED"
        : "REVIEWER_COMMENT_ADDED",
    actor: "REVIEWER",
    details: {
      exceptionId: exception._id,
      aiReviewId: aiReview._id,
      decision,
      recommendation: aiReview.recommendation,
      suggestedValue: aiReview.suggestedValue,
    },
    metadata: {
      source: "AI_REVIEW",
    },
  });

  return {
    exception,
    aiReview,
  };
};


module.exports = {
  generateExceptionRecommendation,
  applyAIRecommendation,
};

