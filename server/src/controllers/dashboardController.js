const Loan = require("../models/Loan");
const Exception = require("../models/Exception");

const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalLoans,
      validLoans,
      exceptionLoans,
      totalExceptions,
      severitySummary,
      typeSummary,
    ] = await Promise.all([
      Loan.countDocuments(),

      Loan.countDocuments({
        validationStatus: "VALID",
      }),

      Loan.countDocuments({
        validationStatus: "EXCEPTION",
      }),

      Exception.countDocuments(),

      Exception.aggregate([
        {
          $group: {
            _id: "$severity",
            count: { $sum: 1 },
          },
        },
      ]),

      Exception.aggregate([
        {
          $group: {
            _id: "$exceptionType",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const severity = {};

    severitySummary.forEach((item) => {
      severity[item._id] = item.count;
    });

    const types = {};

    typeSummary.forEach((item) => {
      types[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalLoans,
        validLoans,
        exceptionLoans,
        totalExceptions,
        severitySummary: severity,
        typeSummary: types,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
};