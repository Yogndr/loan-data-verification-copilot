// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";

// const LoanDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [loan, setLoan] = useState(null);
//   const [exceptions, setExceptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
  
//   const [reviewComments, setReviewComments] = useState({});
//   const [verifying, setVerifying] = useState(false);
//   const [analyzingAi, setAnalyzingAi] = useState({});
//   const [actionSuccess, setActionSuccess] = useState("");

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const [loanRes, exceptionsRes] = await Promise.all([
//         axios.get(`http://localhost:5000/api/loans/${id}`),
//         axios.get(`http://localhost:5000/api/exceptions`, { params: { loanId: id } }),
//       ]);

//       setLoan(loanRes.data.data);
//       setExceptions(exceptionsRes.data.data.exceptions || exceptionsRes.data.data || []);
//     } catch (err) {
//       console.error("Fetch loan error:", err);
//       setError("Failed to load loan record and exceptions.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [id]);

//   const handleReview = async (exceptionId, action) => {
//     try {
//       setActionSuccess("");
//       const comment = reviewComments[exceptionId] || "Reviewed by compliance officer.";
      
//       await axios.patch(`http://localhost:5000/api/exceptions/${exceptionId}/review`, {
//         action,
//         comment,
//       });

//       setActionSuccess(`Exception status updated to ${action}`);
//       await fetchData();
//     } catch (err) {
//       console.error("Review action error:", err);
//       setError(err.response?.data?.message || "Failed to update exception.");
//     }
//   };

//   const handleRunAIAnalysis = async (exceptionId) => {
//     try {
//       setAnalyzingAi((prev) => ({ ...prev, [exceptionId]: true }));
//       await axios.post(`http://localhost:5000/api/ai/exceptions/${exceptionId}/analyze`);
//       await fetchData();
//     } catch (err) {
//       console.error("AI Analysis error:", err);
//       setError("Failed to generate AI analysis.");
//     } finally {
//       setAnalyzingAi((prev) => ({ ...prev, [exceptionId]: false }));
//     }
//   };

//   const handleAIDecision = async (exceptionId, decision) => {
//     try {
//       setActionSuccess("");
//       await axios.post(`http://localhost:5000/api/ai/exceptions/${exceptionId}/decision`, { decision });
//       setActionSuccess(`AI recommendation ${decision.toLowerCase()} successfully.`);
//       await fetchData();
//     } catch (err) {
//       console.error("AI decision error:", err);
//       setError("Failed to apply AI recommendation.");
//     }
//   };

//   const handleVerifyLoan = async () => {
//     try {
//       setVerifying(true);
//       setError("");
//       setActionSuccess("");

//       const res = await axios.post(`http://localhost:5000/api/loans/${id}/verify`, {
//         comment: "All exceptions resolved. Canonical verification approved.",
//       });

//       setActionSuccess(res.data.message || "Loan successfully verified.");
//       await fetchData();
//     } catch (err) {
//       console.error("Verification error:", err);
//       setError(err.response?.data?.message || "Failed to verify loan. Ensure all exceptions are resolved.");
//     } finally {
//       setVerifying(false);
//     }
//   };

//   if (loading) return <div className="page"><div className="loading">Loading loan details...</div></div>;
//   if (error && !loan) return <div className="page"><div className="error">{error}</div></div>;
//   if (!loan) return <div className="page"><div className="empty-state">No loan record found.</div></div>;

//   const hasUnresolvedExceptions = exceptions.some(
//     (e) => e.status === "OPEN" || e.status === "IN_REVIEW"
//   );

//   return (
//     <div className="page">
//       <div className="page-header">
//         <div>
//           <button className="back-link" onClick={() => navigate(-1)}>&larr; Back</button>
//           <h1>Loan File: {loan.loanId}</h1>
//           <p>Borrower ID: {loan.borrowerId || "N/A"} | Validation Status: <strong>{loan.validationStatus}</strong></p>
//         </div>
//         <div>
//           <button
//             className="verify-button"
//             disabled={hasUnresolvedExceptions || verifying || loan.validationStatus === "VALID"}
//             onClick={handleVerifyLoan}
//           >
//             {loan.validationStatus === "VALID" ? "Loan Verified" : verifying ? "Verifying..." : "Verify & Finalize Loan"}
//           </button>
//         </div>
//       </div>

//       {actionSuccess && <div className="success-banner">{actionSuccess}</div>}
//       {error && <div className="error-banner">{error}</div>}

//       <div className="details-grid">
//         <div className="dashboard-section">
//           <h2>Loan Financials & Attributes</h2>
//           <div className="attributes-grid">
//             <div><span>Original Principal</span><strong>${loan.originalPrincipal?.toLocaleString() ?? "N/A"}</strong></div>
//             <div><span>Current Balance</span><strong>${loan.currentBalance?.toLocaleString() ?? "N/A"}</strong></div>
//             <div><span>Interest Rate</span><strong>{loan.interestRate ? `${loan.interestRate}%` : "N/A"}</strong></div>
//             <div><span>Payment Status</span><strong>{loan.paymentStatus || "N/A"}</strong></div>
//             <div><span>Days Past Due (DPD)</span><strong>{loan.daysPastDue ?? "N/A"}</strong></div>
//             <div><span>Borrower State</span><strong>{loan.borrowerState || "N/A"}</strong></div>
//             <div><span>Origination Date</span><strong>{loan.originationDate ? new Date(loan.originationDate).toLocaleDateString() : "N/A"}</strong></div>
//             <div><span>Maturity Date</span><strong>{loan.maturityDate ? new Date(loan.maturityDate).toLocaleDateString() : "N/A"}</strong></div>
//           </div>
//         </div>

//         <div className="dashboard-section">
//           <h2>Validation Exceptions & AI Copilot ({exceptions.length})</h2>
//           {exceptions.length === 0 ? (
//             <p className="no-data">No exceptions triggered for this record.</p>
//           ) : (
//             <div className="exceptions-list">
//               {exceptions.map((ex) => (
//                 <div key={ex._id} className={`exception-card-item ${ex.severity.toLowerCase()}`}>
//                   <div className="exception-item-header">
//                     <div>
//                       <span className={`badge ${ex.severity.toLowerCase()}`}>{ex.severity}</span>
//                       <strong style={{ marginLeft: "8px" }}>{ex.exceptionType.replaceAll("_", " ")}</strong>
//                     </div>
//                     <span className={`status ${ex.status.toLowerCase()}`}>{ex.status.replaceAll("_", " ")}</span>
//                   </div>
                  
//                   <p className="exception-item-message">{ex.message}</p>
                  
//                   {ex.actualValue !== undefined && (
//                     <div className="value-comparison">
//                       <div><span>Actual Value:</span> <code>{String(ex.actualValue)}</code></div>
//                       {ex.expectedValue !== undefined && <div><span>Expected:</span> <code>{String(ex.expectedValue)}</code></div>}
//                     </div>
//                   )}

//                   {/* AI Copilot Recommendation Block */}
//                   {ex.aiReview ? (
//                     <div className="ai-review-card">
//                       <div className="ai-review-header">
//                         <span className="ai-badge">AI Copilot Analysis</span>
//                         <span className="confidence-score">Confidence: {Math.round(ex.aiReview.confidence * 100)}%</span>
//                       </div>
//                       <p className="ai-explanation">{ex.aiReview.explanation}</p>
//                       <div className="ai-recommendation-box">
//                         <strong>Suggested Action:</strong> {ex.aiReview.recommendation}
//                         {ex.aiReview.suggestedValue !== null && (
//                           <div>Suggested Value: <code>{String(ex.aiReview.suggestedValue)}</code></div>
//                         )}
//                       </div>

//                       {ex.status === "OPEN" || ex.status === "IN_REVIEW" ? (
//                         <div className="ai-actions">
//                           <button className="btn-ai-accept" onClick={() => handleAIDecision(ex._id, "ACCEPTED")}>
//                             Accept AI Fix
//                           </button>
//                           <button className="btn-ai-reject" onClick={() => handleAIDecision(ex._id, "REJECTED")}>
//                             Dismiss AI
//                           </button>
//                         </div>
//                       ) : null}
//                     </div>
//                   ) : (
//                     ex.status !== "APPROVED" && (
//                       <button
//                         className="btn-run-ai"
//                         disabled={analyzingAi[ex._id]}
//                         onClick={() => handleRunAIAnalysis(ex._id)}
//                       >
//                         {analyzingAi[ex._id] ? "Analyzing with AI..." : "Consult AI Copilot"}
//                       </button>
//                     )
//                   )}

//                   {/* Manual Review Action Fallback */}
//                   {ex.status === "OPEN" || ex.status === "IN_REVIEW" ? (
//                     <div className="review-action-box">
//                       <input
//                         type="text"
//                         placeholder="Add manual override comment..."
//                         value={reviewComments[ex._id] || ""}
//                         onChange={(e) => setReviewComments({ ...reviewComments, [ex._id]: e.target.value })}
//                       />
//                       <div className="button-group">
//                         <button className="btn-approve" onClick={() => handleReview(ex._id, "APPROVE")}>Approve As Is</button>
//                         <button className="btn-reject" onClick={() => handleReview(ex._id, "REJECT")}>Reject Loan Record</button>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="resolution-metadata">
//                       <span>Resolution Comment: {ex.reviewerComment || "No comment provided."}</span>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoanDetails;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [reviewComments, setReviewComments] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState({});
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [loanRes, exceptionsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/loans/${id}`),
        axios.get(`http://localhost:5000/api/exceptions`, { params: { loanId: id } }),
      ]);

      setLoan(loanRes.data.data);
      setExceptions(exceptionsRes.data.data.exceptions || exceptionsRes.data.data || []);
    } catch (err) {
      console.error("Fetch loan error:", err);
      setError("Failed to load loan record and exceptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleReview = async (exceptionId, action) => {
    try {
      setActionSuccess("");
      const comment = reviewComments[exceptionId] || "Reviewed by compliance officer.";
      
      await axios.patch(`http://localhost:5000/api/exceptions/${exceptionId}/review`, {
        action,
        comment,
      });

      setActionSuccess(`Exception status updated to ${action}`);
      await fetchData();
    } catch (err) {
      console.error("Review action error:", err);
      setError(err.response?.data?.message || "Failed to update exception.");
    }
  };

  const handleRunAIAnalysis = async (exceptionId) => {
  try {
    setAnalyzingAi((prev) => ({
      ...prev,
      [exceptionId]: true,
    }));

    setError("");
    setActionSuccess("");

    const response = await axios.post(
      `http://localhost:5000/api/exceptions/${exceptionId}/ai-recommendation`
    );

    console.log("AI Recommendation:", response.data);

    setActionSuccess("AI recommendation generated successfully.");

    await fetchData();
  } catch (err) {
    console.error("AI Analysis error:", err);

    setError(
      err.response?.data?.message ||
      "Failed to generate AI recommendation."
    );
  } finally {
    setAnalyzingAi((prev) => ({
      ...prev,
      [exceptionId]: false,
    }));
  }
};

  const handleAIDecision = async (exceptionId, decision) => {
    try {
      setActionSuccess("");
      await axios.post(`http://localhost:5000/api/ai/exceptions/${exceptionId}/decision`, { decision });
      setActionSuccess(`AI recommendation ${decision.toLowerCase()} successfully.`);
      await fetchData();
    } catch (err) {
      console.error("AI decision error:", err);
      setError("Failed to apply AI recommendation.");
    }
  };

  const handleVerifyLoan = async () => {
    try {
      setVerifying(true);
      setError("");
      setActionSuccess("");

      const res = await axios.post(`http://localhost:5000/api/loans/${id}/verify`, {
        comment: "All exceptions resolved. Canonical verification approved.",
      });

      setActionSuccess(res.data.message || "Loan successfully verified.");
      await fetchData();
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.response?.data?.message || "Failed to verify loan. Ensure all exceptions are resolved.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="page"><div className="loading">Loading loan details...</div></div>;
  if (error && !loan) return <div className="page"><div className="error">{error}</div></div>;
  if (!loan) return <div className="page"><div className="empty-state">No loan record found.</div></div>;

  const hasUnresolvedExceptions = exceptions.some(
    (e) => e.status === "OPEN" || e.status === "IN_REVIEW"
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate(-1)}>&larr; Back</button>
          <h1>Loan File: {loan.loanId}</h1>
          <p>Borrower ID: {loan.borrowerId || "N/A"} | Validation Status: <strong>{loan.validationStatus}</strong></p>
        </div>
        <div>
          <button
  className={`verify-button ${
    loan.validationStatus === "VALID" ? "verified" : ""
  }`}
  disabled={
    hasUnresolvedExceptions ||
    verifying ||
    loan.validationStatus === "VALID"
  }
  onClick={handleVerifyLoan}
>
  {loan.validationStatus === "VALID"
    ? "✓ Loan Verified"
    : verifying
    ? "Verifying..."
    : "Verify & Finalize Loan"}
</button>
        </div>
      </div>

      {actionSuccess && <div className="success-banner">{actionSuccess}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="details-grid">
        <div className="dashboard-section">
          <h2>Loan Financials & Attributes</h2>
          <div className="attributes-grid">
            <div><span>Original Principal</span><strong>${loan.originalPrincipal?.toLocaleString() ?? "N/A"}</strong></div>
            <div><span>Current Balance</span><strong>${loan.currentBalance?.toLocaleString() ?? "N/A"}</strong></div>
            <div><span>Interest Rate</span><strong>{loan.interestRate ? `${loan.interestRate}%` : "N/A"}</strong></div>
            <div><span>Payment Status</span><strong>{loan.paymentStatus || "N/A"}</strong></div>
            <div><span>Days Past Due (DPD)</span><strong>{loan.daysPastDue ?? "N/A"}</strong></div>
            <div><span>Borrower State</span><strong>{loan.borrowerState || "N/A"}</strong></div>
            <div><span>Origination Date</span><strong>{loan.originationDate ? new Date(loan.originationDate).toLocaleDateString() : "N/A"}</strong></div>
            <div><span>Maturity Date</span><strong>{loan.maturityDate ? new Date(loan.maturityDate).toLocaleDateString() : "N/A"}</strong></div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Validation Exceptions & AI Copilot ({exceptions.length})</h2>
          {exceptions.length === 0 ? (
            <p className="no-data">No exceptions triggered for this record.</p>
          ) : (
            <div className="exceptions-list">
              {exceptions.map((ex) => (
                <div key={ex._id} className={`exception-card-item ${ex.severity.toLowerCase()}`}>
                  <div className="exception-item-header">
                    <div>
                      <span className={`badge ${ex.severity.toLowerCase()}`}>{ex.severity}</span>
                      <strong style={{ marginLeft: "8px" }}>{ex.exceptionType.replaceAll("_", " ")}</strong>
                    </div>
                    <span className={`status ${ex.status.toLowerCase()}`}>{ex.status.replaceAll("_", " ")}</span>
                  </div>
                  
                  <p className="exception-item-message">{ex.message}</p>
                  
                  {ex.actualValue !== undefined && (
                    <div className="value-comparison">
                      <div><span>Actual Value:</span> <code>{String(ex.actualValue)}</code></div>
                      {ex.expectedValue !== undefined && <div><span>Expected:</span> <code>{String(ex.expectedValue)}</code></div>}
                    </div>
                  )}

                  {/* AI Copilot Card */}
                  {ex.aiReview ? (
                    <div className="ai-review-card">
                      <div className="ai-review-header">
                        <span className="ai-badge">AI Copilot Analysis</span>
                        <span className="confidence-score">Confidence: {Math.round(ex.aiReview.confidence * 100)}%</span>
                      </div>
                      <p className="ai-explanation">{ex.aiReview.explanation}</p>
                      <div className="ai-recommendation-box">
                        <strong>Suggested Action:</strong> {ex.aiReview.recommendation}
                        {ex.aiReview.suggestedValue !== null && (
                          <div>Suggested Value: <code>{String(ex.aiReview.suggestedValue)}</code></div>
                        )}
                      </div>

                      {ex.status === "OPEN" || ex.status === "IN_REVIEW" ? (
                        <div className="ai-actions">
                          <button className="btn-ai-accept" onClick={() => handleAIDecision(ex._id, "ACCEPTED")}>
                            Accept AI Fix
                          </button>
                          <button className="btn-ai-reject" onClick={() => handleAIDecision(ex._id, "REJECTED")}>
                            Dismiss AI
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    ex.status !== "APPROVED" && (
                      <button
                        className="btn-run-ai"
                        disabled={analyzingAi[ex._id]}
                        onClick={() => handleRunAIAnalysis(ex._id)}
                      >
                        {analyzingAi[ex._id] ? "Analyzing with AI..." : "Consult AI Copilot"}
                      </button>
                    )
                  )}

                  {/* Manual Review Actions */}
                  {ex.status === "OPEN" || ex.status === "IN_REVIEW" ? (
                    <div className="review-action-box">
                      <input
                        type="text"
                        placeholder="Add manual override comment..."
                        value={reviewComments[ex._id] || ""}
                        onChange={(e) => setReviewComments({ ...reviewComments, [ex._id]: e.target.value })}
                      />
                      <div className="button-group">
                        <button className="btn-approve" onClick={() => handleReview(ex._id, "APPROVE")}>Approve As Is</button>
                        <button className="btn-reject" onClick={() => handleReview(ex._id, "REJECT")}>Reject Loan Record</button>
                      </div>
                    </div>
                  ) : (
                    <div className="resolution-metadata">
                      <span>Resolution Comment: {ex.reviewerComment || "No comment provided."}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;