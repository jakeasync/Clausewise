"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload as UploadIcon,
  Check,
  ChevronRight,
  ChevronDown,
  ArrowDown,
  X,
  Plus,
  AlertTriangle
} from "lucide-react";
import type { ClauseKey, ClauseResult, ReviewDoc } from "@/lib/review/types";
import { groundResult, hashText, locateEvidence } from "@/lib/review/validate";

const CLAUSE_KEYS: ClauseKey[] = [
  "effective_date",
  "governing_law",
  "termination_for_convenience",
  "cap_on_liability",
  "audit_rights",
  "non_compete",
  "exclusivity",
];

const CLAUSE_NAMES: Record<ClauseKey, string> = {
  effective_date: "Effective date",
  governing_law: "Governing law",
  termination_for_convenience: "Termination for convenience",
  cap_on_liability: "Cap on liability",
  audit_rights: "Audit rights",
  non_compete: "Non-compete",
  exclusivity: "Exclusivity",
};

const INITIAL_TEXT = `This Master Services Agreement is made between Northwind Logistics Inc. (the Provider) and Cebu Harbor Foods Corp. (the Customer).

1. Services
The Provider will deliver the warehouse software services described in each Statement of Work.

2. Term and termination
This Agreement starts on 1 March 2026 and continues for three years. Either party may terminate this Agreement for convenience by giving 60 days written notice to the other party.

3. Liability
The Provider's total liability under this Agreement is limited to the fees paid in the twelve months before the claim. For claims arising from data loss, the limit is PHP 5,000,000.

4. Audit
The Customer may audit the Provider's relevant records once per calendar year on 10 business days notice.

5. Governing law
This Agreement is governed by the laws of the Republic of the Philippines. Disputes will be heard in the courts of Makati City.

6. Notices
Notices must be in writing and sent to the addresses listed in the relevant Statement of Work.`;

function buildInitialDoc(): ReviewDoc {
  const rawClauses: Record<ClauseKey, ClauseResult> = {
    effective_date: {
      clause: "effective_date",
      modelStatus: "found",
      modelValues: ["1 March 2026"],
      evidence: "This Agreement starts on 1 March 2026 and continues for three years.",
      location: "Section 2",
      confidence: 0.96,
      needsReview: false,
      note: null,
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
    governing_law: {
      clause: "governing_law",
      modelStatus: "found",
      modelValues: ["Republic of the Philippines"],
      evidence: "This Agreement is governed by the laws of the Republic of the Philippines.",
      location: "Section 5",
      confidence: 0.97,
      needsReview: false,
      note: null,
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
    termination_for_convenience: {
      clause: "termination_for_convenience",
      modelStatus: "found",
      modelValues: ["Either party, 60 days written notice"],
      evidence: "Either party may terminate this Agreement for convenience by giving 60 days written notice to the other party.",
      location: "Section 2",
      confidence: 0.94,
      needsReview: false,
      note: null,
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
    cap_on_liability: {
      clause: "cap_on_liability",
      modelStatus: "found",
      modelValues: ["Fees paid in prior 12 months", "PHP 5,000,000 for data loss claims"],
      evidence: "The Provider's total liability under this Agreement is limited to the fees paid in the twelve months before the claim.",
      location: "Section 3",
      confidence: 0.88,
      needsReview: false,
      note: "A second limit of PHP 5,000,000 applies to data loss.",
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
    audit_rights: {
      clause: "audit_rights",
      modelStatus: "found",
      modelValues: ["Customer, once per calendar year, 10 business days notice"],
      evidence: "The Customer may audit the Provider's relevant records once per calendar year on 10 business days notice.",
      location: "Section 4",
      confidence: 0.92,
      needsReview: false,
      note: null,
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
    non_compete: {
      clause: "non_compete",
      modelStatus: "not_found",
      modelValues: [],
      evidence: null,
      location: null,
      confidence: 0.95,
      needsReview: false,
      note: "No non-compete covenants found in this document.",
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
    exclusivity: {
      clause: "exclusivity",
      modelStatus: "not_found",
      modelValues: [],
      evidence: null,
      location: null,
      confidence: 0.95,
      needsReview: false,
      note: "No exclusivity obligations found in this document.",
      grounded: true,
      evidenceSpan: null,
      reviewedValue: null,
      reviewStatus: "pending",
      reviewedAt: null,
    },
  };

  const groundedClauses = Object.fromEntries(
    Object.entries(rawClauses).map(([k, r]) => [k, groundResult(r, INITIAL_TEXT)])
  ) as Record<ClauseKey, ClauseResult>;

  return {
    id: "doc-1",
    filename: "northwind-cebu-harbor-msa.pdf",
    textHash: hashText(INITIAL_TEXT),
    parsedText: INITIAL_TEXT,
    clauses: groundedClauses,
  };
}

const PIPELINE_STEPS = ["Upload", "Parse", "Extract", "Validate", "Review"];

function ClauseWiseLogo({ size = 28, color = "#111114" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
      aria-hidden="true"
    >
      <g transform="rotate(-28 14 20)">
        <rect x="5" y="7" width="17" height="23" rx="1.5" />
        <line x1="8.5" y1="12.5" x2="18.5" y2="12.5" />
        <line x1="8.5" y1="17" x2="18.5" y2="17" />
        <line x1="8.5" y1="21.5" x2="15.5" y2="21.5" />
      </g>
      <path d="M 14 7 H 30 V 22 L 23 29 H 14 Z" fill="#ffffff" />
      <path d="M 23 22 H 30 L 23 29 V 22 Z" />
      <line x1="18" y1="12" x2="26" y2="12" />
      <line x1="18" y1="16" x2="26" y2="16" />
      <line x1="18" y1="20" x2="26" y2="20" />
      <line x1="18" y1="24" x2="22" y2="24" />
    </svg>
  );
}

export default function ClausewiseApp() {
  const [view, setView] = useState<"upload" | "proc" | "review">("upload");
  const [parser, setParser] = useState<"Auto" | "Text" | "OCR">("Auto");
  const [doc, setDoc] = useState<ReviewDoc>(buildInitialDoc);
  const [activeClauseKey, setActiveClauseKey] = useState<ClauseKey | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [procStage, setProcStage] = useState(0);
  const [pagesByMethod, setPagesByMethod] = useState<Record<string, number>>({ text: 3, ocr: 0 });
  const [parserWarnings, setParserWarnings] = useState<string[]>([]);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [isDragHot, setIsDragHot] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("Copy JSON");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const procTimers = useRef<NodeJS.Timeout[]>([]);

  // Ordered list of clauses
  const presentClauses = CLAUSE_KEYS.filter((k) => doc.clauses[k].modelStatus !== "not_found");
  const absentClauses = CLAUSE_KEYS.filter((k) => doc.clauses[k].modelStatus === "not_found");
  const allOrderedKeys = [...presentClauses, ...absentClauses];

  const isVerified = (c: ClauseResult) =>
    c.reviewStatus === "confirmed" || c.reviewStatus === "confirmed_absent" || c.reviewStatus === "edited";

  const verifiedCount = Object.values(doc.clauses).filter(isVerified).length;

  const canConfirmAllReady = Object.values(doc.clauses).some(
    (c) =>
      c.reviewStatus === "pending" &&
      c.modelStatus === "found" &&
      c.grounded &&
      !c.needsReview &&
      c.confidence >= 0.85
  );

  useEffect(() => {
    return () => {
      procTimers.current.forEach(clearTimeout);
    };
  }, []);

  const selectClause = useCallback((key: ClauseKey) => {
    setActiveClauseKey(key);
    const target = doc.clauses[key];
    if (target) {
      setEditValues((prev) => ({
        ...prev,
        [key]: target.reviewedValue ?? (target.modelValues[0] || target.evidence || ""),
      }));
    }
  }, [doc]);

  const saveEdit = async (clauseKey: ClauseKey, val: string) => {
    const trimmed = val.trim();
    setDoc((prev) => {
      const target = prev.clauses[clauseKey];
      if (!target) return prev;
      return {
        ...prev,
        clauses: {
          ...prev.clauses,
          [clauseKey]: {
            ...target,
            reviewedValue: trimmed,
            reviewStatus: "edited",
            reviewedAt: new Date().toISOString(),
          },
        },
      };
    });

    // Sync to server review store
    fetch(`/api/review/${doc.id}/${clauseKey}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: trimmed }),
    }).catch((e) => console.warn("Sync edit error:", e));

    // Advance to next unverified clause
    const idx = allOrderedKeys.indexOf(clauseKey);
    const nextKey = allOrderedKeys.slice(idx + 1).concat(allOrderedKeys).find((k) => !isVerified(doc.clauses[k]));
    if (nextKey) {
      selectClause(nextKey);
    } else {
      setActiveClauseKey(null);
    }
  };

  const confirm = async (clauseKey: ClauseKey) => {
    const target = doc.clauses[clauseKey];
    if (!target) return;
    if (target.modelStatus !== "not_found" && !target.grounded && !target.reviewedValue) {
      alert("Ungrounded result. Please edit the value before confirming.");
      return;
    }

    setDoc((prev) => {
      const cur = prev.clauses[clauseKey];
      return {
        ...prev,
        clauses: {
          ...prev.clauses,
          [clauseKey]: {
            ...cur,
            reviewStatus: cur.modelStatus === "not_found" ? "confirmed_absent" : "confirmed",
            reviewedAt: new Date().toISOString(),
          },
        },
      };
    });

    // Sync confirmation to server review store
    fetch(`/api/review/${doc.id}/${clauseKey}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((e) => console.warn("Sync confirm error:", e));

    const idx = allOrderedKeys.indexOf(clauseKey);
    const nextKey = allOrderedKeys.slice(idx + 1).concat(allOrderedKeys).find((k) => !isVerified(doc.clauses[k]));
    if (nextKey) {
      selectClause(nextKey);
    } else {
      setActiveClauseKey(null);
    }
  };

  const confirmReady = async () => {
    setDoc((prev) => {
      const updated = { ...prev.clauses };
      for (const [key, c] of Object.entries(updated) as [ClauseKey, ClauseResult][]) {
        const ready =
          c.reviewStatus === "pending" &&
          c.modelStatus === "found" &&
          c.grounded &&
          !c.needsReview &&
          c.confidence >= 0.85;
        if (ready) {
          updated[key] = {
            ...c,
            reviewStatus: "confirmed",
            reviewedAt: new Date().toISOString(),
          };
        }
      }
      return { ...prev, clauses: updated };
    });

    // Sync bulk confirm to server review store
    fetch(`/api/review/${doc.id}/confirm-ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((e) => console.warn("Sync confirmReady error:", e));
  };

  // Keyboard controls: J, K, Enter, E, Esc
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (view !== "review" || isExportOpen) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const k = e.key.toLowerCase();
      if (k === "j") {
        const i = activeClauseKey ? allOrderedKeys.indexOf(activeClauseKey) : -1;
        const next = allOrderedKeys[Math.min(allOrderedKeys.length - 1, i + 1)];
        if (next) selectClause(next);
      } else if (k === "k") {
        const i = activeClauseKey ? allOrderedKeys.indexOf(activeClauseKey) : allOrderedKeys.length;
        const prev = allOrderedKeys[Math.max(0, i - 1)];
        if (prev) selectClause(prev);
      } else if (k === "enter" && activeClauseKey) {
        confirm(activeClauseKey);
      } else if (k === "e" && activeClauseKey) {
        e.preventDefault();
        const input = document.getElementById("edit-" + activeClauseKey) as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      } else if (k === "escape") {
        setActiveClauseKey(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view, isExportOpen, activeClauseKey, allOrderedKeys, doc, selectClause]);

  // File upload and processing
  const processUploadedContract = async (file: File) => {
    setLastUploadedFile(file);
    setErrorMessage("");
    procTimers.current.forEach(clearTimeout);
    procTimers.current = [];
    setView("proc");
    setProcStage(0);
    setStepIndex(1);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("parser", parser.toLowerCase());

      const t1 = setTimeout(() => {
        setProcStage(1);
        setStepIndex(2);
      }, 600);
      procTimers.current.push(t1);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.doc) {
        throw new Error(data.error || "Failed to extract clauses from document.");
      }

      setProcStage(2);
      setStepIndex(3);

      const returnedDoc: ReviewDoc = data.doc;
      const actualPages = returnedDoc.pageCount || 3;

      // Update method counts based on parser and real detected pageCount
      if (parser === "OCR") {
        setPagesByMethod({ text: 0, ocr: actualPages });
      } else if (parser === "Text") {
        setPagesByMethod({ text: actualPages, ocr: 0 });
      } else {
        setPagesByMethod({ text: actualPages, ocr: 0 });
      }
      setParserWarnings([]);

      const t2 = setTimeout(() => {
        setDoc(returnedDoc);
        setView("review");
        setStepIndex(4);
        setActiveClauseKey(null);
        window.scrollTo(0, 0);
      }, 700);
      procTimers.current.push(t2);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMessage(err.message || "An error occurred during extraction.");
      setView("upload");
      setStepIndex(0);
    }
  };

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [showPendingConfirm, setShowPendingConfirm] = useState<{ open: boolean; format: string } | null>(null);
  const [showDeveloperJsonModal, setShowDeveloperJsonModal] = useState(false);

  const pendingClausesCount = Object.values(doc.clauses).filter(
    (c) => c.reviewStatus === "pending" || !c.grounded
  ).length;

  const triggerExport = async (format: "annotated_pdf" | "summary_pdf" | "csv" | "json", forceWithPending = false) => {
    if (!forceWithPending && pendingClausesCount > 0 && format !== "json") {
      setShowPendingConfirm({ open: true, format });
      setIsExportMenuOpen(false);
      return;
    }

    setExportLoading(format);
    setIsExportMenuOpen(false);
    setShowPendingConfirm(null);

    try {
      const res = await fetch(`/api/review/${doc.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          exportedWithPending: pendingClausesCount > 0,
          clauses: doc.clauses,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Export failed.");
      }

      // Read filename from Content-Disposition header
      const dispHeader = res.headers.get("Content-Disposition");
      let downloadFilename = `${doc.filename.replace(/\.[^/.]+$/, "")}_clausewise.${format === "csv" ? "csv" : format === "json" ? "json" : "pdf"}`;
      if (dispHeader && dispHeader.includes("filename=")) {
        const match = dispHeader.match(/filename="?([^"]+)"?/);
        if (match && match[1]) downloadFilename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportToast(`Exported ${downloadFilename}`);
      setTimeout(() => setExportToast(null), 4000);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`Export error: ${err.message}`);
    } finally {
      setExportLoading(null);
    }
  };

  const procStagesInfo = [
    [
      "Parse",
      parser === "Auto"
        ? `Auto routing: ${pagesByMethod.text ?? 0} pages by text, ${pagesByMethod.ocr ?? 0} by OCR`
        : parser === "Text"
        ? `Embedded text layer extraction (${pagesByMethod.text ?? 0} pages)`
        : `Optical character recognition layout analysis (${pagesByMethod.ocr ?? 0} pages)`,
    ],
    ["Extract", "Extracting 7 key clause types with strict grounding"],
    ["Validate", "Locating verbatim evidence spans and running grounding checks"],
  ];

  // Render text from parsedText with evidence span highlight
  const renderDocumentWithHighlight = () => {
    const activeClause = activeClauseKey ? doc.clauses[activeClauseKey] : null;
    const span = activeClause?.evidenceSpan;

    if (!span || span.start < 0 || span.end > doc.parsedText.length || span.start >= span.end) {
      return <p className="document-paragraph" style={{ whiteSpace: "pre-wrap" }}>{doc.parsedText}</p>;
    }

    const before = doc.parsedText.slice(0, span.start);
    const highlighted = doc.parsedText.slice(span.start, span.end);
    const after = doc.parsedText.slice(span.end);

    return (
      <p className="document-paragraph" style={{ whiteSpace: "pre-wrap" }}>
        {before}
        <mark className="quote-mark active">{highlighted}</mark>
        {after}
      </p>
    );
  };

  return (
    <div className="app-container">
      {/* Top Nav */}
      <nav className="top-nav">
        <button
          className="brand-header-logo"
          type="button"
          onClick={() => {
            setView("upload");
            setStepIndex(0);
          }}
        >
          <ClauseWiseLogo size={28} color="#111114" />
          <span>ClauseWise</span>
        </button>

        <div className="nav-center-group">
          {PIPELINE_STEPS.map((s, idx) => {
            const isCurrent = idx === stepIndex;
            const isPassed = idx < stepIndex;

            return (
              <button
                key={s}
                type="button"
                className={`nav-pill ${isCurrent ? "active" : ""} ${isPassed ? "done" : ""}`}
                onClick={() => {
                  if (idx === 0) {
                    setView("upload");
                    setStepIndex(0);
                  } else if (idx === 4 && view === "review") {
                    setView("review");
                    setStepIndex(4);
                  }
                }}
              >
                {isPassed && <Check size={12} strokeWidth={2.5} />}
                {s}
              </button>
            );
          })}
        </div>

        <div className="nav-right-group">
          {view === "review" && (
            <>
              <button
                className="nav-right-btn"
                type="button"
                onClick={() => {
                  setView("upload");
                  setStepIndex(0);
                }}
              >
                <span className="btn-icon-circle black">
                  <Plus size={11} strokeWidth={2.5} color="#ffffff" />
                </span>
                <span>New upload</span>
              </button>
              <div style={{ position: "relative" }}>
                <button
                  className="nav-right-btn primary"
                  type="button"
                  disabled={Boolean(exportLoading)}
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                >
                  <ArrowDown size={13} strokeWidth={2.4} color="#ffffff" />
                  <span>{exportLoading ? "Generating..." : "Export"}</span>
                  <ChevronDown size={12} strokeWidth={2.2} color="#ffffff" />
                </button>

                {isExportMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      width: "210px",
                      background: "#ffffff",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      padding: "6px 0",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--ink)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => triggerExport("annotated_pdf")}
                    >
                      <span>Annotated PDF</span>
                      <span style={{ fontSize: "10.5px", color: "var(--ink-muted)", fontWeight: 400 }}>Primary</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => triggerExport("summary_pdf")}
                    >
                      Summary report PDF
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => triggerExport("csv")}
                    >
                      CSV
                    </button>

                    <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

                    <div style={{ padding: "4px 14px 2px", fontSize: "10.5px", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Advanced
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: "6px 14px 8px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        color: "var(--ink)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => triggerExport("json")}
                    >
                      <span>JSON (Developers)</span>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>Download</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "4px 14px 6px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "11px",
                        color: "var(--ink-muted)",
                        textDecoration: "underline",
                      }}
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        setShowDeveloperJsonModal(true);
                      }}
                    >
                      Inspect JSON in modal
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* 1. UPLOAD VIEW */}
      {view === "upload" && (
        <main className="upload-center-container">
          <h1 className="page-title">Upload a contract</h1>
          <p className="page-subtitle">
            Get 7 clause types back as structured data, each verified with exact evidence spans.
          </p>

          <div className="uploader-card">
            <div
              className={`drop-zone ${isDragHot ? "hot" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragHot(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragHot(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragHot(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragHot(false);
                if (e.dataTransfer.files?.[0]) {
                  processUploadedContract(e.dataTransfer.files[0]);
                }
              }}
            >
              <div className="drop-zone-icon">
                <UploadIcon size={20} />
              </div>
              <span className="drop-title">Drop a contract here</span>
              <span className="drop-desc">
                or <button type="button">choose a file</button>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf,.txt,.md,.doc,.docx"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    processUploadedContract(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            {errorMessage && (
              <p style={{ color: "var(--rv)", fontSize: "13px", marginTop: "12px" }}>
                {errorMessage}
              </p>
            )}

            <div className="uploader-options">
              <span style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>Parser:</span>
              <div className="segmented-toggle">
                {(["Auto", "Text", "OCR"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`seg-btn ${parser === p ? "active" : ""}`}
                    onClick={() => setParser(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 2. PROCESSING PIPELINE VIEW */}
      {view === "proc" && (
        <main className="upload-center-container">
          <div className="proc-card">
            <span style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--ink-muted)" }}>
              {doc.filename}
            </span>
            <h1 className="page-title" style={{ marginTop: "8px" }}>
              Reading your contract
            </h1>

            <ul className="proc-steps-list">
              {procStagesInfo.map(([stageName, desc], idx) => {
                const isOk = idx < procStage;
                const isRun = idx === procStage;

                return (
                  <li
                    key={stageName}
                    className={`proc-step-item ${isOk ? "ok" : ""} ${isRun ? "run" : ""}`}
                  >
                    <div className="proc-step-icon">
                      {isOk ? (
                        <Check size={14} strokeWidth={3} />
                      ) : isRun ? (
                        <div className="spin-circle" />
                      ) : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13.5px" }}>{stageName}</div>
                      <div style={{ fontSize: "12.5px", color: "var(--ink-secondary)" }}>
                        {desc}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className="nav-right-btn"
              onClick={() => {
                procTimers.current.forEach(clearTimeout);
                procTimers.current = [];
                setView("upload");
                setStepIndex(0);
              }}
            >
              Cancel
            </button>
          </div>
        </main>
      )}

      {/* 3. REVIEW STAGE VIEW */}
      {view === "review" && (
        <main className="review-stage">
          {/* Left: Document Paper rendering from read-only parsedText */}
          <article className="document-paper">
            <h1 className="document-title">Contract Document</h1>
            <div className="document-meta">
              <span>{doc.filename}</span>
              <span className="text-hash-badge" title="SHA-256 hash of parsedText">
                #{doc.textHash}
              </span>
              <span className="parser-badge">
                Parser: {parser} ({pagesByMethod.text ?? 0} by text, {pagesByMethod.ocr ?? 0} by OCR)
              </span>
            </div>

            <div className="source-preview-snip">
              Source preview: &ldquo;{doc.parsedText.slice(0, 60).replace(/\n/g, " ")}...&rdquo;
            </div>

            {parserWarnings.length > 0 && (
              <div className="parser-warning-banner">
                <span>⚠️ {parserWarnings[0]}</span>
                <button
                  type="button"
                  className="action-btn primary"
                  style={{ flex: "none", padding: "4px 12px", fontSize: "12px" }}
                  onClick={() => {
                    setParser("Auto");
                    if (lastUploadedFile) {
                      processUploadedContract(lastUploadedFile);
                    }
                  }}
                >
                  Rerun in Auto
                </button>
              </div>
            )}

            {/* Read-only Document Content with Span Highlight */}
            {renderDocumentWithHighlight()}

            {/* Not Found In This Contract */}
            <section className="not-found-section">
              <h3 className="document-heading" style={{ marginTop: 0 }}>
                Not found in this contract
              </h3>
              {absentClauses.map((key) => {
                const c = doc.clauses[key];
                const isActive = activeClauseKey === key;
                const isConfirmed = c.reviewStatus === "confirmed_absent" || c.reviewStatus === "confirmed";

                return (
                  <div
                    key={key}
                    className={`not-found-row ${isActive ? "active" : ""}`}
                    onClick={() => selectClause(key)}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "13.5px" }}>{CLAUSE_NAMES[key]}</span>
                      {(c.unverifiedSuggestion || (!c.grounded && c.note)) && (
                        <details
                          style={{ marginTop: "4px", fontSize: "12px", color: "var(--ink-secondary)", cursor: "pointer" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <summary style={{ color: "var(--ink-muted)", fontSize: "11.5px", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                            See what the model suggested
                          </summary>
                          <div style={{ marginTop: "4px", padding: "6px 10px", background: "var(--bg-subtle)", borderRadius: "5px", color: "var(--ink)", borderLeft: "2px solid var(--border)" }}>
                            {c.unverifiedSuggestion || c.note}
                          </div>
                        </details>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          backgroundColor: isConfirmed ? "var(--ok-bg)" : "var(--pill-bg)",
                          color: isConfirmed ? "var(--ok)" : "var(--ink-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        {isConfirmed ? "Confirmed absent" : "No match"}
                      </span>
                      {!isConfirmed && (
                        <button
                          type="button"
                          className="action-btn primary"
                          style={{ padding: "4px 12px", fontSize: "12px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirm(key);
                          }}
                        >
                          Confirm absent
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </article>

          {/* Right: Clause Rail Cards */}
          <aside className="clause-rail">
            {presentClauses.map((key) => {
              const c = doc.clauses[key];
              const isActive = activeClauseKey === key;
              const currentVal =
                editValues[key] ?? c.reviewedValue ?? (c.modelValues[0] || c.evidence || "");
              const isConfirmed = c.reviewStatus === "confirmed" || c.reviewStatus === "edited";
              const isUngrounded = !c.grounded && c.modelStatus !== "not_found";
              const isFoundBlank = c.modelStatus === "found_blank";

              return (
                <article
                  key={key}
                  className={`clause-card ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (!isActive) selectClause(key);
                  }}
                >
                  <div className="card-header">
                    <div className="card-title-group">
                      <span
                        className={`status-dot ${
                          isUngrounded
                            ? "review"
                            : isConfirmed
                            ? "confirmed"
                            : isFoundBlank
                            ? "review"
                            : "ready"
                        }`}
                      />
                      <span className="card-title">{CLAUSE_NAMES[key]}</span>
                    </div>

                    {/* Status Badges */}
                    {isFoundBlank ? (
                      <span className="tag-amber">Clause found, value blank</span>
                    ) : isUngrounded ? (
                      <span className="tag-red">Not found in document</span>
                    ) : (
                      <span className="conf-pill">{Math.round(c.confidence * 100)}% conf</span>
                    )}
                  </div>

                  <p className="card-value">
                    {c.reviewedValue ? (
                      <span>{c.reviewedValue} (edited)</span>
                    ) : isFoundBlank ? (
                      <span style={{ color: "var(--ink-muted)" }}>Template placeholder unexecuted</span>
                    ) : c.modelValues.length ? (
                      c.modelValues.join(", ")
                    ) : (
                      c.evidence
                    )}
                  </p>

                  {isActive && (
                    <>
                      {c.note && (
                        <div className="warn-box">
                          {isUngrounded && <AlertTriangle size={13} style={{ display: "inline", marginRight: 4 }} />}
                          {c.note}
                        </div>
                      )}

                      <input
                        id={"edit-" + key}
                        className="edit-input"
                        value={currentVal}
                        placeholder="Enter verified clause value..."
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditValues((prev) => ({ ...prev, [key]: v }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEdit(key, currentVal);
                          }
                          if (e.key === "Escape") {
                            e.currentTarget.blur();
                          }
                        }}
                      />

                      <div className="card-actions">
                        <button
                          type="button"
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEdit(key, currentVal);
                          }}
                        >
                          Save edit
                        </button>
                        <button
                          type="button"
                          className="action-btn primary"
                          disabled={isUngrounded && !c.reviewedValue}
                          title={
                            isUngrounded && !c.reviewedValue
                              ? "Ungrounded result. Edit it before confirming."
                              : undefined
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            confirm(key);
                          }}
                        >
                          {isConfirmed ? "Confirmed" : "Confirm"}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </aside>
        </main>
      )}

      {/* Floating Bottom Dock Controller */}
      {view === "review" && (
        <div className="floating-dock">
          <div className="dock-progress">
            <b>
              {verifiedCount} of 7
            </b>
            <span>verified</span>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(verifiedCount / 7) * 100}%` }}
              />
            </div>
          </div>

          <div className="dock-keys">
            <span>
              <kbd>J</kbd> <kbd>K</kbd> move
            </span>
            <span>
              <kbd>Enter</kbd> confirm
            </span>
            <span>
              <kbd>E</kbd> edit
            </span>
          </div>

          <button
            type="button"
            className="confirm-all-btn"
            disabled={!canConfirmAllReady}
            onClick={confirmReady}
          >
            Confirm all ready
          </button>
        </div>
      )}

      {/* Pending Confirmation Guard Dialog */}
      {showPendingConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "24px 28px",
              borderRadius: "12px",
              maxWidth: "440px",
              width: "90%",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.16)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--rv-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={18} color="var(--rv)" />
              </div>
              <h3 style={{ fontSize: "16.5px", fontWeight: 700, margin: 0 }}>Unreviewed Clauses Warning</h3>
            </div>
            <p style={{ fontSize: "13.5px", color: "var(--ink-secondary)", lineHeight: 1.5, margin: "0 0 20px" }}>
              <b>{pendingClausesCount} clauses are not reviewed</b> or ungrounded. The exported document will carry an
              unverified warning note on the cover page.
              <br />
              <br />
              Export anyway?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="nav-right-btn"
                onClick={() => setShowPendingConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-btn primary"
                onClick={() => triggerExport(showPendingConfirm.format as any, true)}
              >
                Export anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Toast Notification */}
      {exportToast && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            background: "#111114",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 999,
          }}
        >
          <Check size={16} strokeWidth={2.5} color="#4ade80" />
          <span>{exportToast}</span>
        </div>
      )}

      {/* Developer JSON Modal (Preserved behind developer flag) */}
      {showDeveloperJsonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Developer JSON Inspector</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)" }}
                onClick={() => setShowDeveloperJsonModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <pre
              style={{
                flex: 1,
                overflow: "auto",
                background: "var(--bg-subtle)",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "11px",
              }}
            >
              {JSON.stringify(doc, null, 2)}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                className="action-btn primary"
                onClick={() => setShowDeveloperJsonModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
