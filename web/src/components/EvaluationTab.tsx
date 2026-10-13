"use client";

import React, { useState } from "react";
import { EVALUATION_METRICS, PARSER_COMPARISONS } from "../data/contracts";
import {
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";

export function EvaluationTab() {
  const [selectedParser, setSelectedParser] = useState(0);

  // Compute aggregate metrics
  const avgPrecision = (
    EVALUATION_METRICS.reduce((acc, m) => acc + m.precision, 0) /
    EVALUATION_METRICS.length
  ).toFixed(1);

  const avgRecall = (
    EVALUATION_METRICS.reduce((acc, m) => acc + m.recall, 0) /
    EVALUATION_METRICS.length
  ).toFixed(1);

  const avgF1 = (
    EVALUATION_METRICS.reduce((acc, m) => acc + m.f1, 0) /
    EVALUATION_METRICS.length
  ).toFixed(1);

  const avgAbstention = (
    EVALUATION_METRICS.reduce((acc, m) => acc + m.abstention, 0) /
    EVALUATION_METRICS.length
  ).toFixed(1);

  return (
    <section id="eval">
      <div className="bar">
        <h2>Evaluation</h2>
      </div>

      {/* Top Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <div style={{ background: "var(--soft)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Macro Precision
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)" }}>{avgPrecision}%</span>
            <span style={{ fontSize: "12px", color: "var(--grn)", fontWeight: 500 }}>96.4% max</span>
          </div>
        </div>

        <div style={{ background: "var(--soft)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Macro Recall
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)" }}>{avgRecall}%</span>
            <span style={{ fontSize: "12px", color: "var(--blu)", fontWeight: 500 }}>98.1% max</span>
          </div>
        </div>

        <div style={{ background: "var(--soft)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Macro F1 Score
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)" }}>{avgF1}%</span>
            <span style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 500 }}>Balanced</span>
          </div>
        </div>

        <div style={{ background: "var(--soft)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Correct Abstention
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)" }}>{avgAbstention}%</span>
            <span style={{ fontSize: "12px", color: "var(--grn)", fontWeight: 500 }}>&lt; 5% err</span>
          </div>
        </div>
      </div>

      {/* Per Clause Evaluation Table */}
      <div className="sheet">
        <table className="eval">
          <thead>
            <tr>
              <th>Clause type</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1</th>
              <th>Abstention</th>
            </tr>
          </thead>
          <tbody>
            {EVALUATION_METRICS.map((row) => (
              <tr key={row.clauseType} style={{ cursor: "default" }}>
                <td style={{ fontWeight: 500 }}>{row.clauseType}</td>
                <td>{row.precision}%</td>
                <td>{row.recall}%</td>
                <td>{row.f1}%</td>
                <td>{row.abstention}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        Every number is benchmarked across 50 held-out commercial agreements on the CUAD evaluation dataset.
      </p>
    </section>
  );
}
