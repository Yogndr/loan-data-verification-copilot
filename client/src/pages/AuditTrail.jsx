import { useEffect, useState } from "react";
import axios from "axios";

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/loans/audit-trail");
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Audit log error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDownloadCsv = () => {
    window.open("http://localhost:5000/api/loans/export?format=csv", "_blank");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Trail & Verified Exports</h1>
          <p>Cryptographically chained event logs (SHA-256) & dataset delivery</p>
        </div>
        <div>
          <button className="verify-button" onClick={handleDownloadCsv}>
            Export Verified CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading cryptographic audit trail...</div>
      ) : (
        <div className="exception-table-wrapper">
          <table className="exception-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event</th>
                <th>Actor / Role</th>
                <th>Current Block Hash (SHA-256)</th>
                <th>Previous Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td><strong>{log.eventType}</strong></td>
                  <td>{log.role || "SYSTEM"}</td>
                  <td><code style={{ fontSize: "11px" }}>{log.currentHash ? log.currentHash.substring(0, 16) + "..." : "N/A"}</code></td>
                  <td><code style={{ fontSize: "11px" }}>{log.previousHash ? log.previousHash.substring(0, 16) + "..." : "GENESIS"}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;