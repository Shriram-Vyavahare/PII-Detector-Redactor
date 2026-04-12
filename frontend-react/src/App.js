import { useState, useCallback } from "react";
import "./App.css";

const PII_LABELS = {
  aadhaar:           "Aadhaar Number",
  pan:               "PAN Card",
  phone:             "Phone Number",
  email:             "Email Address",
  ifsc:              "IFSC Code",
  bankAccount:       "Bank Account Number",
  paymentCardNumber: "Payment Card Number",
};

const PII_ICONS = {
  aadhaar:           "🪪",
  pan:               "📋",
  phone:             "📱",
  email:             "✉️",
  ifsc:              "🏦",
  bankAccount:       "💳",
  paymentCardNumber: "💳",
};

export default function App() {
  const [selectedFile, setSelectedFile]   = useState(null);
  const [dragging, setDragging]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [results, setResults]             = useState(null);
  const [downloadPath, setDownloadPath]   = useState("");
  const [reportPath, setReportPath]       = useState("");
  const [error, setError]                 = useState("");

  const getFilename = (filePath) => filePath.split("/").pop() || "download.pdf";

  /* ── File selection ──────────────────────────────────────────────── */

  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setResults(null);
    setDownloadPath("");
    setReportPath("");
  };

  const onInputChange = (e) => handleFileChange(e.target.files[0]);

  /* ── Drag & Drop ─────────────────────────────────────────────────── */

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true);  }, []);
  const onDragLeave = useCallback(()  => setDragging(false), []);
  const onDrop      = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  }, []);

  /* ── Process ─────────────────────────────────────────────────────── */

  const handleProcess = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError("");
    setResults(null);

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      const res  = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error processing document");
      }

      setResults(data);
      setDownloadPath(data.redactedFile || "");
      setReportPath(data.reportFile    || "");
      setSelectedFile(null);
    } catch (err) {
      setDownloadPath("");
      setReportPath("");
      setError(err.message || "Something went wrong while processing the file.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Download helper ─────────────────────────────────────────────── */

  const triggerDownload = async (path) => {
    try {
      setError("");

      const response = await fetch(path);
      if (!response.ok) {
        throw new Error("Generated file could not be downloaded.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = blobUrl;
      a.download = getFilename(path);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Unable to download the generated file.");
    }
  };

  /* ── Derived stats ───────────────────────────────────────────────── */

  const piiEntries = results?.detectedPII
    ? Object.entries(results.detectedPII)
    : [];

  const totalCount = piiEntries.reduce((sum, [, items]) => sum + items.length, 0);
  const highCount  = piiEntries.reduce(
    (sum, [, items]) => sum + items.filter(i => i.confidence === "HIGH").length, 0
  );

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="app">

      {/* ── Background decoration ── */}
      <div className="bg-grid" />
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />

      <div className="card">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-icon">🔐</div>
          <h1 className="title">PII Detector <span>&amp;</span> Redactor</h1>
          <p className="subtitle">
            Upload a document to detect, analyse and redact sensitive personal information
          </p>
        </header>

        {/* ── Upload zone ── */}
        <div
          className={`drop-zone ${dragging ? "dragging" : ""} ${selectedFile ? "has-file" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx"
            hidden
            onChange={onInputChange}
          />

          {selectedFile ? (
            <div className="file-preview">
              <span className="file-icon">
                {selectedFile.name.endsWith(".pdf") ? "📄" : "📝"}
              </span>
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              >✕</button>
            </div>
          ) : (
            <div className="drop-content">
              <div className="drop-icon">⬆</div>
              <p className="drop-text">Drag &amp; drop your file here</p>
              <p className="drop-hint">or click to browse</p>
              <span className="formats-badge">PDF &nbsp;·&nbsp; DOCX</span>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && <div className="error-banner">⚠ {error}</div>}

        {/* ── Process button ── */}
        <button
          className={`process-btn ${loading ? "loading" : ""}`}
          disabled={!selectedFile || loading}
          onClick={handleProcess}
        >
          {loading ? (
            <><span className="spinner" /> Analysing document…</>
          ) : (
            "Detect & Redact"
          )}
        </button>

        {/* ── Results ── */}
        {results && (
          <div className="results-section">

            {/* No PII case */}
            {piiEntries.length === 0 ? (
              <div className="no-pii">
                <span className="no-pii-icon">✅</span>
                <p>No sensitive information detected in this document.</p>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="stats-bar">
                  <div className="stat-chip">
                    <span className="stat-num">{totalCount}</span>
                    <span className="stat-lbl">Total PII Found</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-num">{piiEntries.length}</span>
                    <span className="stat-lbl">PII Types</span>
                  </div>
                  <div className="stat-chip high-chip">
                    <span className="stat-num">{highCount}</span>
                    <span className="stat-lbl">High Confidence</span>
                  </div>
                  <div className="stat-chip low-chip">
                    <span className="stat-num">{totalCount - highCount}</span>
                    <span className="stat-lbl">Low Confidence</span>
                  </div>
                </div>

                {/* PII list grouped by type */}
                <div className="pii-groups">
                  {piiEntries.map(([type, items]) => (
                    <div className="pii-group" key={type}>
                      <div className="group-header">
                        <span className="group-icon">{PII_ICONS[type] || "🔍"}</span>
                        <span className="group-label">
                          {PII_LABELS[type] || type.toUpperCase()}
                        </span>
                        <span className="group-count">{items.length}</span>
                      </div>
                      <div className="group-items">
                        {items.map((item, idx) => (
                          <div className="pii-item" key={idx}>
                            <span className="pii-value">{item.value}</span>
                            <span className={`confidence-badge ${item.confidence === "HIGH" ? "high" : "low"}`}>
                              {item.confidence}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Download buttons */}
                <div className="download-row">
                  <button
                    className="dl-btn redact-btn"
                    disabled={!downloadPath}
                    onClick={() => triggerDownload(downloadPath)}
                  >
                    ⬇&nbsp; Download Redacted File
                  </button>
                  <button
                    className="dl-btn report-btn"
                    disabled={!reportPath}
                    onClick={() => triggerDownload(reportPath)}
                  >
                    📄&nbsp; Download Report
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
