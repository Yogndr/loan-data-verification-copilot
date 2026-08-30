
require("dotenv").config();

const app = require("./app");
// app.use("/api/audit", auditRoutes);
const connectDB = require("./config/db");
const auditRoutes = require("./routes/auditRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const loanRoutes = require("./routes/loanRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const PORT = process.env.PORT || 5000;

app.use("/api/audit", auditRoutes);
app.use("/api/loans", verificationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/validation", dashboardRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

