import { useState, useRef } from "react";
import { createPortal } from "react-dom";
// Adjust this import to wherever your Supabase client is exported from
// (the same client your other Student Directory calls already use).
import { supabase } from "../../lib/supabase";

// ---- Types -----------------------------------------------------------

interface ParsedRow {
  name: string;
  enrollment_no: string;
  email: string;
}

interface RowError {
  row: number;
  enrollment_no?: string;
  reason: string;
}

interface RowCreated {
  enrollment_no: string;
  name: string;
  temp_password: string;
}

interface BulkResult {
  status: string;
  created: RowCreated[];
  errors: RowError[];
}

interface ClassOption {
  id: string;
  name: string;
  studentCount: number;
}

interface Props {
  classes: ClassOption[]; // same list ClassStudentsView already holds in state
  defaultClassId?: string; // optional preselect
  onImported?: () => void; // call this to refresh the roster list after a successful import
  onClose: () => void;
}

// ---- CSV parsing (no external deps) -----------------------------------

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const firstCols = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const hasHeader =
    firstCols.includes("name") &&
    (firstCols.includes("enrollment_no") || firstCols.includes("enrollment no"));

  const dataLines = hasHeader ? lines.slice(1) : lines;

  let nameIdx = 0,
    enrollIdx = 1,
    emailIdx = 2;
  if (hasHeader) {
    nameIdx = firstCols.indexOf("name");
    enrollIdx = firstCols.findIndex((c) => c === "enrollment_no" || c === "enrollment no");
    const eIdx = firstCols.indexOf("email");
    emailIdx = eIdx === -1 ? -1 : eIdx;
  }

  return dataLines
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        name: cols[nameIdx] ?? "",
        enrollment_no: cols[enrollIdx] ?? "",
        email: emailIdx === -1 ? "" : cols[emailIdx] ?? "",
      };
    })
    // guard against phantom rows from stray whitespace-only lines
    .filter((r) => r.name.length > 0 || r.enrollment_no.length > 0);
}

// ---- Inline style objects (bypasses Tailwind entirely) -----------------

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "640px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    overflow: "hidden",
    isolation: "isolate",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#171717",
    color: "#ffffff",
    padding: "20px 24px",
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#34d399",
    fontWeight: 600,
    margin: 0,
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    margin: "4px 0 0 0",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#d4d4d4",
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
  },
  body: {
    padding: "24px",
    overflowY: "auto",
    backgroundColor: "#ffffff",
  },
  helpText: {
    fontSize: "13px",
    color: "#525252",
    lineHeight: 1.5,
    margin: "0 0 20px 0",
  },
  code: {
    background: "#f5f5f5",
    padding: "1px 5px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "12px",
  },
  fieldLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#737373",
    marginBottom: "6px",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d4d4d4",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#171717",
    backgroundColor: "#ffffff",
    marginBottom: "22px",
  },
  uploadBox: {
    border: "2px dashed #a7f3d0",
    backgroundColor: "#f0fdf9",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "18px",
    textAlign: "center",
  },
  chooseFileBtn: {
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  uploadHint: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "18px 0",
    color: "#a3a3a3",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e5e5e5",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d4d4d4",
    borderRadius: "10px",
    padding: "12px",
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#171717",
    resize: "vertical",
    minHeight: "110px",
  },
  previewWrap: {
    marginTop: "20px",
  },
  previewLabel: {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#737373",
    marginBottom: "8px",
  },
  tableWrap: {
    maxHeight: "180px",
    overflowY: "auto",
    border: "1px solid #e5e5e5",
    borderRadius: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    backgroundColor: "#fafafa",
    color: "#737373",
    fontSize: "11px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e5e5e5",
  },
  td: {
    padding: "6px 12px",
    borderTop: "1px solid #f0f0f0",
  },
  missing: {
    color: "#ef4444",
  },
  errorBox: {
    marginTop: "16px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
  },
  successBox: {
    marginTop: "16px",
    backgroundColor: "#ecfdf5",
    borderRadius: "10px",
    padding: "12px 16px",
  },
  warnBox: {
    marginTop: "12px",
    backgroundColor: "#fffbeb",
    borderRadius: "10px",
    padding: "12px 16px",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1px solid #f0f0f0",
    flexShrink: 0,
    backgroundColor: "#ffffff",
  },
  cancelBtn: {
    background: "transparent",
    border: "none",
    color: "#525252",
    fontSize: "14px",
    fontWeight: 600,
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

// ---- Component ---------------------------------------------------------

export default function BulkImportStudentsModal({
  classes,
  defaultClassId,
  onImported,
  onClose,
}: Props) {
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId ?? "");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setFileName(file.name);
      setRawText(text);
      setRows(parseCsv(text));
      setResult(null);
      setError(null);
    };
    reader.readAsText(file);
  }

  function handleTextChange(text: string) {
    setFileName(null);
    setRawText(text);
    setRows(parseCsv(text));
    setResult(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!selectedClassId) {
      setError("Choose a class before importing.");
      return;
    }
    if (rows.length === 0) {
      setError("No rows to import. Paste CSV or upload a file first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Not logged in — no active session token.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/students-bulk-create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ class_id: selectedClassId, rows }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setError(json?.message || json?.error || `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }

      setResult(json as BulkResult);
      if ((json?.errors?.length ?? 0) === 0) {
        onImported?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Render via portal --------------------------------------------
  // This is the fix: mounting straight into document.body means no
  // ancestor's transform/filter/backdrop-blur/will-change can ever
  // trap our `position: fixed` overlay again. It will always cover
  // the true viewport, full stop.
  return createPortal(
    <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Student Directory</p>
            <h2 style={styles.title}>Bulk Import Students</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={styles.body}>
          <p style={styles.helpText}>
            Upload a CSV or paste rows below. Columns: <code style={styles.code}>name</code>,{" "}
            <code style={styles.code}>enrollment_no</code>,{" "}
            <code style={styles.code}>email</code> (email optional). A header row is optional
            and auto-detected.
          </p>

          <label style={styles.fieldLabel}>Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={styles.select}
          >
            <option value="" disabled>
              Select a class…
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} students)
              </option>
            ))}
          </select>

          <div style={styles.uploadBox}>
            <button
              type="button"
              style={styles.chooseFileBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose CSV File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <p style={styles.uploadHint}>
              {fileName ? `Selected: ${fileName}` : "CSV files only"}
            </p>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span>or paste manually</span>
            <span style={styles.dividerLine} />
          </div>

          <textarea
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={"name,enrollment_no,email\nJohn Doe,SYIT045,\nJane Roe,SYIT046,jane@example.com"}
            rows={5}
            style={styles.textarea}
          />

          {rows.length > 0 && (
            <div style={styles.previewWrap}>
              <p style={styles.previewLabel}>
                Preview — {rows.length} row{rows.length !== 1 ? "s" : ""}
              </p>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Enrollment No</th>
                      <th style={styles.th}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td style={styles.td}>
                          {r.name || <span style={styles.missing}>missing</span>}
                        </td>
                        <td style={styles.td}>
                          {r.enrollment_no || <span style={styles.missing}>missing</span>}
                        </td>
                        <td style={{ ...styles.td, color: "#a3a3a3" }}>{r.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          {result && (
            <>
              {result.created.length > 0 && (
                <div style={styles.successBox}>
                  <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#047857", fontSize: 13 }}>
                    ✓ {result.created.length} student{result.created.length !== 1 ? "s" : ""} created
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#065f46" }}>
                    {result.created.map((c) => (
                      <li key={c.enrollment_no}>
                        {c.name} ({c.enrollment_no}) — temp password: {c.temp_password}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.errors.length > 0 && (
                <div style={styles.warnBox}>
                  <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#b45309", fontSize: 13 }}>
                    ⚠ {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#92400e" }}>
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}
                        {e.enrollment_no ? ` (${e.enrollment_no})` : ""}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={submitting || rows.length === 0 || !selectedClassId}
              style={{
                ...styles.submitBtn,
                ...((submitting || rows.length === 0 || !selectedClassId)
                  ? styles.submitBtnDisabled
                  : {}),
              }}
            >
              {submitting
                ? "Importing…"
                : `Import ${rows.length || ""} Student${rows.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
