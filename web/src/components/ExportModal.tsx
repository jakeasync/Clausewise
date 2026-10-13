"use client";

import React, { useState } from "react";
import { X, Download, FileJson, FileSpreadsheet, Check } from "lucide-react";
import { Contract } from "../data/contracts";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
}

export function ExportModal({ isOpen, onClose, contracts }: ExportModalProps) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    let content = "";
    let mimeType = "";
    let filename = "";

    if (format === "json") {
      const exportData = contracts.map((c) => ({
        contract_id: c.id,
        contract_name: c.name,
        batch: c.batch,
        file_type: c.fileType,
        uploaded_at: c.uploadedAt,
        extracted_clauses: c.clauses.map((cl) => ({
          clause_type: cl.clauseType,
          extracted_value: cl.extractedValue,
          result: cl.result,
          source_section: cl.source,
          source_quote: cl.sourceQuote,
          confidence_score: cl.confidence / 100,
          validation_status: cl.status,
          schema_valid: cl.validationCheck.schemaValid,
          quote_verified: cl.validationCheck.quoteMatches,
          reviewer_notes: cl.notes || null
        }))
      }));

      content = JSON.stringify(exportData, null, 2);
      mimeType = "application/json";
      filename = `clauselens_results_${Date.now()}.json`;
    } else {
      // CSV format
      const headers = [
        "Contract Name",
        "Batch",
        "Clause Type",
        "Extracted Value",
        "Result",
        "Source Section",
        "Confidence",
        "Status",
        "Quote Grounded",
        "Notes"
      ];

      const rows: string[] = [headers.join(",")];
      contracts.forEach((c) => {
        c.clauses.forEach((cl) => {
          rows.push(
            [
              `"${c.name}"`,
              `"${c.batch}"`,
              `"${cl.clauseType}"`,
              `"${cl.extractedValue.replace(/"/g, '""')}"`,
              `"${cl.result}"`,
              `"${cl.source}"`,
              `"${cl.confidence}%"`,
              `"${cl.status}"`,
              `"${cl.validationCheck.quoteMatches ? "YES" : "NO"}"`,
              `"${(cl.notes || "").replace(/"/g, '""')}"`
            ].join(",")
          );
        });
      });

      content = rows.join("\n");
      mimeType = "text/csv;charset=utf-8;";
      filename = `clauselens_results_${Date.now()}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#e2e8f0] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#edf2f7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Export Extraction Results</h3>
              <p className="text-[11px] text-[#64748b]">Download verified clause dataset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#0f172a] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("json")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                format === "json"
                  ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-600"
                  : "border-[#e2e8f0] hover:border-slate-300"
              }`}
            >
              <FileJson className="w-5 h-5 text-blue-600 mb-2" />
              <div className="text-xs font-bold text-[#0f172a]">JSON Format</div>
              <div className="text-[11px] text-[#64748b] mt-0.5">
                Full schema, offsets, &amp; quote grounding
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                format === "csv"
                  ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-600"
                  : "border-[#e2e8f0] hover:border-slate-300"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="text-xs font-bold text-[#0f172a]">CSV Table</div>
              <div className="text-[11px] text-[#64748b] mt-0.5">
                Formatted for Excel and review workflows
              </div>
            </button>
          </div>

          <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] text-[11px] text-[#64748b]">
            Includes all contracts in the current session ({contracts.length} contracts,{" "}
            {contracts.reduce((sum, c) => sum + c.clauses.length, 0)} total clauses).
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
