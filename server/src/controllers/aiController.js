
const {
  applyAIRecommendation,
} = require("../services/aiService");

const handleAIDecision = async (req, res) => {
  try {
    const { exceptionId } = req.params;
    const { decision } = req.body;

    if (!["ACCEPTED", "REJECTED", "EDITED"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid decision. Must be ACCEPTED, REJECTED, or EDITED",
      });
    }

    const result = await applyAIRecommendation(
      exceptionId,
      decision
    );

    res.json({
      success: true,
      message: `AI recommendation ${decision.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("AI Decision error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to apply AI decision",
      error: error.message,
    });
  }
};

module.exports = {
  handleAIDecision,
};
