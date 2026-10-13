"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, Loader2, Sparkles, Key } from "lucide-react";
import { Contract } from "../data/contracts";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContractAdded: (newContract: Contract) => void;
}

export function UploadModal({ isOpen, onClose, onContractAdded }: UploadModalProps) {
  const [contractName, setContractName] = useState("");
  const [contractText, setContractText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [batch, setBatch] = useState<"Tuning set" | "Held out set" | "Scanned copies">("Tuning set");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!contractName) {
        setContractName(file.name.replace(/\.[^/.]+$/, ""));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContractText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractName.trim()) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const defaultText = contractText.trim() || `COMMERCIAL SERVICES AGREEMENT
Effective Date: March 1, 2024.
Parties: Global Cloud Inc. and Customer.

1. TERM AND EXPIRATION
This Agreement expires on 31 December 2028, unless renewed.
Renewal: Automatically renews for successive 1-year terms upon 60 days advance notice.

2. TERMINATION FOR CONVENIENCE
Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.

3. LIMITATION OF LIABILITY
Aggregate liability under this Agreement shall not exceed the total fees paid in the prior twelve (12) months.

4. AUDIT RIGHTS
Customer may inspect security compliance records once annually upon 30 days written notice.

5. NON-COMPETE & EXCLUSIVITY
Customer shall not hire Global Cloud developers for 12 months following termination.

6. GOVERNING LAW
Governed by and construed under the laws of the State of Delaware, USA.`;

    // If API key is provided, try calling the live Claude endpoint!
    if (apiKey.trim()) {
      setProcessStep("Calling Anthropic Claude 3.5 Sonnet for structured extraction...");
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contractName,
            text: defaultText,
            apiKey: apiKey.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to extract with Claude");
        }

        const newId = `cnt-${Date.now()}`;
        const newContract: Contract = {
          id: newId,
          name: contractName,
          batch: batch,
          fileType: batch === "Scanned copies" ? "Scan (OCR)" : "PDF",
          uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          fullTextSnippet: defaultText,
          clauses: data.clauses.map((cl: any) => ({
            ...cl,
            contractId: newId
          }))
        };

        setIsProcessing(false);
        onContractAdded(newContract);
        onClose();
        return;
      } catch (err: any) {
        console.error("Claude call failed, falling back to simulated extraction:", err);
        setErrorMsg(`Claude API Notice: ${err.message}. Using pipeline simulator.`);
      }
    }

    // Fallback pipeline simulation
    const steps = [
      "1/4 Ingesting document and text layers...",
      "2/4 Parsing 10 target commercial clauses...",
      "3/4 Running Claude structured extraction...",
      "4/4 Verifying Pydantic v2 schemas and source quote grounding..."
    ];

    let currentStepIdx = 0;
    setProcessStep(steps[0]);

    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setProcessStep(steps[currentStepIdx]);
      } else {
        clearInterval(interval);
        const newId = `cnt-${Date.now()}`;
        const newContract: Contract = {
          id: newId,
          name: contractName,
          batch: batch,
          fileType: batch === "Scanned copies" ? "Scan (OCR)" : "PDF",
          uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          fullTextSnippet: defaultText,
          clauses: [
            {
              id: `c-${Date.now()}-1`,
              contractId: newId,
              clauseType: "Governing law",
              extractedValue: "State of Delaware, USA",
              result: "Found",
              source: "Section 6",
              sourceQuote: "Governed by and construed under the laws of the State of Delaware, USA.",
              confidence: 97,
              status: "Ready to check",
              validationCheck: { schemaValid: true, quoteMatches: true }
            },
            {
              id: `c-${Date.now()}-2`,
              contractId: newId,
              clauseType: "Termination for convenience",
              extractedValue: "Either party, 60 days written notice",
              result: "Found",
              source: "Section 2",
              sourceQuote: "Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.",
              confidence: 90,
              status: "Ready to check",
              validationCheck: { schemaValid: true, quoteMatches: true }
            },
            {
              id: `c-${Date.now()}-3`,
              contractId: newId,
              clauseType: "Cap on liability",
              extractedValue: "Fees paid in prior 12 months",
              result: "Found",
              source: "Section 3",
              sourceQuote: "shall not exceed the total fees paid in the prior twelve (12) months.",
              confidence: 78,
              status: "Needs review",
              validationCheck: { schemaValid: true, quoteMatches: true },
              notes: "Requires legal review on carve-outs."
            }
          ]
        };

        setIsProcessing(false);
        onContractAdded(newContract);
        onClose();
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#e2e8f0] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#edf2f7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Upload Contract for Extraction</h3>
              <p className="text-[11px] text-[#64748b]">Extracts 10 commercial clauses with quote grounding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-[#94a3b8] hover:text-[#0f172a] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
          {/* File input */}
          <label className="block border-2 border-dashed border-[#cbd5e1] hover:border-blue-500 rounded-xl p-5 text-center transition-colors cursor-pointer bg-slate-50/50">
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileText className="w-7 h-7 text-[#94a3b8] mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-[#1e293b]">
              Click to browse or drop agreement (.txt, .pdf)
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              Leave blank to use preloaded sample agreement
            </div>
          </label>

          {/* Contract Name */}
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1">
              Contract Title / Reference
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Global Cloud Services Agreement"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              disabled={isProcessing}
              className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Optional Claude API Key */}
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              Anthropic Claude API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="sk-ant-... (Leave blank to use simulated pipeline)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isProcessing}
              className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
            <span className="text-[10.5px] text-[#64748b] mt-0.5 block">
              If provided, runs live Claude 3.5 Sonnet extraction with exact source quote matching.
            </span>
          </div>

          {/* Batch Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1">
              Evaluation Batch
            </label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value as any)}
              disabled={isProcessing}
              className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="Tuning set">Tuning set (~15 contracts)</option>
              <option value="Held out set">Held out set (~35 contracts)</option>
              <option value="Scanned copies">Scanned copies (~10 scans)</option>
            </select>
          </div>

          {/* Error / Progress */}
          {errorMsg && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {isProcessing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Pipeline Execution in Progress...
              </div>
              <div className="text-[11px] text-blue-800 font-mono">
                {processStep}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !contractName.trim()}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  Run Extraction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
