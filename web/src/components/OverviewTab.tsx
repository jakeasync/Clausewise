"use client";

import React from "react";
import {
  FileText,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Database,
  Layers,
  Sparkles
} from "lucide-react";
import { Contract } from "../data/contracts";

interface OverviewTabProps {
  contracts: Contract[];
  onNavigateTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export function OverviewTab({ contracts, onNavigateTab, onOpenUpload }: OverviewTabProps) {
  const totalClauses = contracts.reduce((acc, c) => acc + c.clauses.length, 0);
  const pendingCount = contracts.reduce(
    (acc, c) =>
      acc +
      c.clauses.filter((cl) => cl.status === "Needs review" || cl.status === "Ready to check").length,
    0
  );
  const confirmedCount = contracts.reduce(
    (acc, c) => acc + c.clauses.filter((cl) => cl.status === "Confirmed").length,
    0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "14px",
          padding: "24px 28px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                color: "#93c5fd",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: "9999px",
                border: "1px solid rgba(147, 197, 253, 0.3)"
              }}
            >
              Enterprise Contract Intelligence
            </span>
            <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
              CUAD 10 Benchmark v1.0
            </span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0", letterSpacing: "-0.01em" }}>
            ClauseLens Document Processing Pipeline
          </h2>
          <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
            Automated commercial contract extraction with dual-layer Pydantic schema validation and verbatim source quote grounding to eliminate hallucinations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onOpenUpload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s ease"
            }}
          >
            <Upload style={{ width: "14px", height: "14px" }} />
            <span>Process Contract</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            boxShadow: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#667085" }}>Contracts Analyzed</span>
            <FileText style={{ width: "16px", height: "16px", color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#101828", marginBottom: "4px" }}>
            {contracts.length}
          </div>
          <div style={{ fontSize: "11px", color: "#667085" }}>
            Across 3 evaluation batches
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            boxShadow: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#667085" }}>Clauses Extracted</span>
            <CheckCircle2 style={{ width: "16px", height: "16px", color: "#12b76a" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#101828", marginBottom: "4px" }}>
            {totalClauses}
          </div>
          <div style={{ fontSize: "11px", color: "#12b76a", fontWeight: 500 }}>
            {confirmedCount} verified by reviewers
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            boxShadow: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#667085" }}>Macro F1 Accuracy</span>
            <TrendingUp style={{ width: "16px", height: "16px", color: "#7c3aed" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#101828", marginBottom: "4px" }}>
            91.8%
          </div>
          <div style={{ fontSize: "11px", color: "#667085" }}>
            Held-out CUAD benchmark
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            boxShadow: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#667085" }}>Pending Verification</span>
            <AlertTriangle style={{ width: "16px", height: "16px", color: "#f04438" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#101828", marginBottom: "4px" }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: "11px", color: "#f04438", fontWeight: 500 }}>
            Awaiting human sign-off
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #f0f0f0",
          padding: "24px",
          boxShadow: "none"
        }}
      >
        <div style={{ marginBottom: "18px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#101828", margin: "0 0 4px 0" }}>
            Automated Processing Pipeline Stages
          </h3>
          <p style={{ fontSize: "12px", color: "#667085", margin: 0 }}>
            How documents travel through OCR, Bedrock/Claude inference, validation, and human review.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#dbeafe", color: "#1d4ed8", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>Document Ingest</span>
            </div>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Receives native PDFs, scanned TIFFs, or plaintext agreements. Dispatches to Amazon Textract for OCR.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#e0e7ff", color: "#4338ca", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>Claude Extraction</span>
            </div>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Parses the 10 target covenants with strict temperature=0 output and verbatim quote grounding.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#d1fae5", color: "#047857", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>Dual Validation</span>
            </div>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Runs Pydantic v2 schema assertions and substring quote checks against the original text to stop hallucinations.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#ffedd5", color: "#c2410c", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>Review Queue</span>
            </div>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Routes verified clauses to auto-approval; flags low-confidence or ambiguous exceptions for legal counsel.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #f0f0f0",
            padding: "20px 24px",
            boxShadow: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#101828", margin: 0 }}>
              Recent Processed Agreements
            </h3>
            <button
              onClick={() => onNavigateTab("review-queue")}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#111827",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>View all in queue</span>
              <ArrowRight style={{ width: "13px", height: "13px" }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {contracts.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigateTab("review-queue")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #f5f5f5",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  transition: "background 0.15s ease"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#101828" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#667085", marginTop: "2px" }}>
                    {c.batch} • {c.fileType} • Uploaded {c.uploadedAt}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "#f3f4f6",
                      color: "#344054"
                    }}
                  >
                    {c.clauses.length} clauses
                  </span>
                  <ArrowRight style={{ width: "13px", height: "13px", color: "#98a2b3" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #f0f0f0",
              padding: "20px",
              boxShadow: "none"
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#101828", margin: "0 0 12px 0" }}>
              Quick Navigation
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => onNavigateTab("review-queue")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #f0f0f0",
                  backgroundColor: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#344054",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck style={{ width: "15px", height: "15px", color: "#111827" }} />
                  <span>Review Queue ({pendingCount} items)</span>
                </div>
                <ArrowRight style={{ width: "13px", height: "13px", color: "#98a2b3" }} />
              </button>

              <button
                onClick={() => onNavigateTab("evaluation")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #f0f0f0",
                  backgroundColor: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#344054",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp style={{ width: "15px", height: "15px", color: "#111827" }} />
                  <span>CUAD Evaluation Benchmark</span>
                </div>
                <ArrowRight style={{ width: "13px", height: "13px", color: "#98a2b3" }} />
              </button>

              <button
                onClick={() => onNavigateTab("exports")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #f0f0f0",
                  backgroundColor: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#344054",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database style={{ width: "15px", height: "15px", color: "#111827" }} />
                  <span>Download Export Datasets</span>
                </div>
                <ArrowRight style={{ width: "13px", height: "13px", color: "#98a2b3" }} />
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #f0f0f0",
              padding: "16px 18px",
              fontSize: "11.5px"
            }}
          >
            <div style={{ fontWeight: 600, color: "#101828", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cpu style={{ width: "13px", height: "13px", color: "#111827" }} />
              Inference Engine
            </div>
            <div style={{ color: "#667085", lineHeight: 1.5 }}>
              Anthropic Claude Opus 5.5 &bull; Pydantic v2 &bull; Substring Grounding &bull; Zero Hallucination Mode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
