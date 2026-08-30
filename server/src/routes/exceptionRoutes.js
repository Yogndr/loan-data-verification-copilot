
const express = require("express");

const {
  getExceptions,
  getExceptionById,
  reviewException,
  getAIRecommendation
} = require("../controllers/exceptionController");

const router = express.Router();

router.get("/", getExceptions);

router.get("/:id", getExceptionById);

router.patch("/:id/review", reviewException);
router.post("/:id/ai-recommendation", getAIRecommendation);

module.exports = router;

