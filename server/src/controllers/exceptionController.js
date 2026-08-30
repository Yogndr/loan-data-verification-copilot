const Exception = require("../models/Exception");
const Loan = require("../models/Loan");
const AIReview = require("../models/AIReview");
const { createAuditLog } = require("../services/auditService");
const {
  generateExceptionRecommendation,
} = require("../services/aiService");

const getExceptions = async (req, res) => {
  try {
    const { severity, status, loanId, page = 1, limit = 50 } = req.query;

    const query = {};

    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (loanId) query.loanId = loanId;

    const skip = (Number(page) - 1) * Number(limit);

    const [exceptions, total] = await Promise.all([
      Exception.find(query)
        .populate("loanId")
        .populate("aiReview")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Exception.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        exceptions,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get exceptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exceptions",
      error: error.message,
    });
  }
};

const getExceptionById = async (req, res) => {
  try {
    const exception = await Exception.findById(req.params.id)
      .populate("loanId")
      .populate("aiReview");

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: "Exception not found",
      });
    }

    res.json({
      success: true,
      data: exception,
    });
  } catch (error) {
    console.error("Get exception by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exception",
      error: error.message,
    });
  }
};

const reviewException = async (req, res) => {
  try {
    const { action, comment } = req.body;

    const allowedActions = [
      "APPROVE",
      "REJECT",
      "REQUEST_CORRECTION",
    ];

    if (!action || !allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Allowed actions: APPROVE, REJECT, REQUEST_CORRECTION",
      });
    }

    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: "Exception not found",
      });
    }

    const statusMap = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      REQUEST_CORRECTION: "CORRECTED",
    };

    exception.status = statusMap[action];

    if (comment !== undefined) {
      exception.reviewerComment = comment;
    }

    await exception.save();

    res.json({
      success: true,
      message: `Exception ${action.toLowerCase()}d successfully`,
      data: exception,
    });
  } catch (error) {
    console.error("Review exception error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review exception",
      error: error.message,
    });
  }
};

const getAIRecommendation = async (req, res) => {
  try {
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: "Exception not found",
      });
    }

    const loan = await Loan.findById(exception.loanId).lean();

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Associated loan not found",
      });
    }

    // Generate AI recommendation
    const recommendation = await generateExceptionRecommendation({
      exception: exception.toObject(),
      loan,
    });

    // Remove any previous AI review for this exception
    await AIReview.deleteMany({
      exception: exception._id,
    });

    // Save AI review
    const aiReview = await AIReview.create({
      exception: exception._id,
      explanation: recommendation.issue,
      recommendation: recommendation.recommendedAction,
      suggestedValue: recommendation.suggestedValue || null,
      confidence:
        recommendation.confidence === "HIGH"
          ? 0.9
          : recommendation.confidence === "MEDIUM"
          ? 0.7
          : 0.5,
      evidence: [
        recommendation.whyItMatters,
        `Current value: ${exception.actualValue}`,
      ],
      model: "Google Gemini",
      prompt: "Loan exception analysis",
      decision: "PENDING",
    });

    // Link AI review to exception
    exception.aiReview = aiReview._id;
    await exception.save();

    await createAuditLog({
  loanId: loan._id,
  action: "AI_RECOMMENDATION_GENERATED",
  actor: "SYSTEM",
  details: {
    exceptionId: exception._id,
    exceptionType: exception.exceptionType,
    recommendation: recommendation.recommendedAction,
    confidence: recommendation.confidence,
  },
  metadata: {
    model: "Google Gemini",
  },
});

    res.json({
      success: true,
      message: "AI recommendation generated successfully",
      data: {
        exceptionId: exception._id,
        loanId: loan._id,
        recommendation,
        aiReviewId: aiReview._id,
      },
    });
  } catch (error) {
    console.error("AI recommendation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate AI recommendation",
      error: error.message,
    });
  }
};
module.exports = {
  getExceptions,
  getExceptionById,
  reviewException,
  getAIRecommendation,
};