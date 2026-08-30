
import { useState } from "react";

function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setResult(data);
      setFile(null);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "auto" }}>
      <h1>Upload Loan Data</h1>

      <p>Select a CSV file containing loan records.</p>

      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: "10px",
          padding: "40px",
          textAlign: "center",
          marginTop: "25px",
        }}
      >
        <input
          type="file"
           accept=".csv"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setError("");
            setResult(null);
          }}
        />

        {file && (
          <p>
            Selected: <strong>{file.name}</strong>
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Uploading..." : "Upload & Import"}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: "20px" }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Upload Successful ✓</h3>
          <p>{result.message}</p>

          <pre>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Upload;

