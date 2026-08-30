import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Exceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchExceptions = async () => {
    try {
      setLoading(true);

      const params = {};

      if (severity) {
        params.severity = severity;
      }

      if (status) {
        params.status = status;
      }

      const response = await axios.get(
        "http://localhost:5000/api/exceptions",
        {
          params,
        }
      );

      setExceptions(response.data.data.exceptions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Exception fetch error:", error);
      setError("Failed to load exceptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [severity, status]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Exceptions</h1>
          <p>Review and resolve loan validation exceptions</p>
        </div>
      </div>

      {/* Filters */}

      <div className="filters">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="CORRECTED">Corrected</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading && (
        <div className="loading">
          Loading exceptions...
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="exception-table-wrapper">
            <table className="exception-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Exception</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {exceptions.map((exception) => (
                  <tr key={exception._id}>
                    <td>
                      {exception.loanId?.loanId || "N/A"}
                    </td>

                    <td>
                      {exception.exceptionType.replaceAll(
                        "_",
                        " "
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${exception.severity.toLowerCase()}`}
                      >
                        {exception.severity}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status ${exception.status.toLowerCase()}`}
                      >
                        {exception.status.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="message-cell">
                      {exception.message}
                    </td>

                    <td>
                      {exception.loanId?._id && (
                        <Link
                          className="view-button"
                          to={`/loans/${exception.loanId._id}`}
                        >
                          View Loan
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {exceptions.length === 0 && (
            <div className="empty-state">
              No exceptions found.
            </div>
          )}

          {pagination && (
            <div className="pagination">
              Showing {exceptions.length} of{" "}
              {pagination.total} exceptions
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Exceptions;