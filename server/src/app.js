const express = require("express");
const cors = require("cors");

const uploadRoutes = require("./routes/uploadRoutes");
const validationRoutes = require("./routes/validationRoutes");
const exceptionRoutes = require("./routes/exceptionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const loanRoutes = require("./routes/loanRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Loan Verification Copilot API is running",
  });
});
app.use("/api/exceptions", exceptionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dashboard", dashboardRoutes);
module.exports = app;