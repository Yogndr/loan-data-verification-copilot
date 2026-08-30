const express = require("express");
const {
 
  handleAIDecision,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/exceptions/:exceptionId/decision", handleAIDecision);

module.exports = router;