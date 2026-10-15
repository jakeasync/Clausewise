"use client";

import React, { useState, useEffect } from "react";
import { Search, FileText, CheckSquare, BarChart2, X, ArrowRight } from "lucide-react";
import { Contract, ClauseItem } from "../data/contracts";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  onSelectClause: (clause: ClauseItem, contract: Contract) => void;
  onNavigateTab: (tab: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  contracts,
  onSelectClause,
  onNavigateTab
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchingClauses: { clause: ClauseItem; contract: Contract }[] = [];
  contracts.forEach((c) => {
    c.clauses.forEach((cl) => {
      if (
        query.trim() === "" ||
        cl.clauseType.toLowerCase().includes(query.toLowerCase()) ||
        cl.extractedValue.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase())
      ) {
        matchingClauses.push({ clause: cl, contract: c });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-[#cbd5e1] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-[#e2e8f0] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#94a3b8]" />
          <input
            type="text"
            autoFocus
            placeholder="Search contracts, clauses, or jump to views..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-[#0f172a] focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#94a3b8] hover:text-[#0f172a] rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === "" && (
            <div className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
              Quick Views
            </div>
          )}

          {query.trim() === "" && (
            <div className="space-y-1 mb-2">
              <button
                onClick={() => {
                  onNavigateTab("review-queue");
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#1e293b] hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Review Queue (6 pending items)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8]" />
              </button>

              <button
                onClick={() => {
                  onNavigateTab("evaluation");
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#1e293b] hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  <span>CUAD Benchmark &amp; Parser Evaluation</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8]" />
              </button>
            </div>
          )}

          <div className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
            Clauses ({matchingClauses.length})
          </div>

          <div className="space-y-1">
            {matchingClauses.slice(0, 8).map(({ clause, contract }) => (
              <button
                key={clause.id}
                onClick={() => {
                  onSelectClause(clause, contract);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                    <span>{clause.clauseType}</span>
                    <span className="text-[10px] text-[#64748b] font-normal">
                      • {contract.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748b] truncate max-w-sm">
                    {clause.extractedValue}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-[#475569]">
                  {clause.confidence}%
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 border-t border-[#e2e8f0] text-[11px] text-[#64748b] flex justify-between px-4">
          <span>Tip: Navigate with arrow keys or click</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
