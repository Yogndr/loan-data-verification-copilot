
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/validation/summary"
        );

        setStats(response.data.data);
      } catch (error) {
        console.error("Dashboard error:", error);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <div className="empty-state">
          No dashboard data available.
        </div>
      </div>
    );
  }

  const totalLoans = stats.totalLoans || 0;
  const validLoans = stats.validLoans || 0;
  const exceptionLoans = stats.exceptionLoans || 0;
  const totalExceptions = stats.totalExceptions || 0;

  const validationRate =
    totalLoans > 0
      ? ((validLoans / totalLoans) * 100).toFixed(1)
      : "0.0";

  const severity = stats.severitySummary || {};
  const typeSummary = stats.typeSummary || {};

  const maxTypeCount = Math.max(
    ...Object.values(typeSummary),
    1
  );

  return (
    <div className="page">

      {/* Header */}
      <div className="dashboard-header dashboard-header-enhanced">
        <div>
          <div className="eyebrow">LOAN DATA OPERATIONS</div>

          <h1>Loan Verification Copilot</h1>

          <p>
            Validate, investigate, and finalize loan records with
            AI-assisted exception resolution.
          </p>
        </div>

        <Link to="/exceptions" className="primary-action">
          Review Exceptions →
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">

        <div className="stat-card stat-primary">
          <div className="stat-card-top">
            <span>Total Loans</span>
            <span className="stat-icon">↗</span>
          </div>

          <strong>
            {totalLoans.toLocaleString()}
          </strong>

          <small>Records ingested</small>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-card-top">
            <span>Valid Loans</span>
            <span className="stat-icon">✓</span>
          </div>

          <strong>
            {validLoans.toLocaleString()}
          </strong>

          <small>{validationRate}% validation success rate</small>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-card-top">
            <span>Exception Loans</span>
            <span className="stat-icon">!</span>
          </div>

          <strong>
            {exceptionLoans.toLocaleString()}
          </strong>

          <small>Loans requiring review</small>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-card-top">
            <span>Total Exceptions</span>
            <span className="stat-icon">⚠</span>
          </div>

          <strong>
            {totalExceptions.toLocaleString()}
          </strong>

          <small>Validation issues detected</small>
        </div>

      </div>

      {/* Validation Overview */}
      <div className="dashboard-section validation-overview">

        <div className="section-heading">
          <div>
            <h2>Validation Overview</h2>
            <p>
              Current health of the loan validation pipeline
            </p>
          </div>

          <div className="validation-rate">
            <strong>{validationRate}%</strong>
            <span>Valid</span>
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(Number(validationRate), 100)}%`,
            }}
          />
        </div>

        <div className="validation-summary">
          <span>
            <strong>{validLoans.toLocaleString()}</strong> valid
          </span>

          <span>
            <strong>{exceptionLoans.toLocaleString()}</strong>{" "}
            with exceptions
          </span>

          <span>
            <strong>{totalExceptions.toLocaleString()}</strong>{" "}
            issues detected
          </span>
        </div>

      </div>

      {/* Severity */}
      <div className="dashboard-section">

        <div className="section-heading">
          <div>
            <h2>Exception Severity</h2>
            <p>Issues grouped by validation severity</p>
          </div>

          <Link to="/exceptions" className="section-link">
            View all →
          </Link>
        </div>

        <div className="severity-grid">

          <div className="severity-card critical">
            <div className="severity-label">
              <span className="severity-dot" />
              Critical
            </div>

            <strong>{severity.CRITICAL || 0}</strong>

            <small>Immediate attention</small>
          </div>

          <div className="severity-card high">
            <div className="severity-label">
              <span className="severity-dot" />
              High
            </div>

            <strong>{severity.HIGH || 0}</strong>

            <small>Priority review</small>
          </div>

          <div className="severity-card medium">
            <div className="severity-label">
              <span className="severity-dot" />
              Medium
            </div>

            <strong>{severity.MEDIUM || 0}</strong>

            <small>Review recommended</small>
          </div>

          <div className="severity-card low">
            <div className="severity-label">
              <span className="severity-dot" />
              Low
            </div>

            <strong>{severity.LOW || 0}</strong>

            <small>Minor discrepancy</small>
          </div>

        </div>
      </div>

      {/* Exception Types */}
      <div className="dashboard-section">

        <div className="section-heading">
          <div>
            <h2>Exception Types</h2>
            <p>Most common validation issues detected</p>
          </div>
        </div>

        {Object.keys(typeSummary).length === 0 ? (
          <div className="no-data">
            No exception types available.
          </div>
        ) : (
          <div className="exception-types">

            {Object.entries(typeSummary)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {

                const percentage =
                  (count / maxTypeCount) * 100;

                return (
                  <div className="type-row" key={type}>

                    <div className="type-info">
                      <span>
                        {type.replaceAll("_", " ")}
                      </span>

                      <strong>{count}</strong>
                    </div>

                    <div className="type-bar">
                      <div
                        className="type-bar-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                  </div>
                );
              })}

          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;

