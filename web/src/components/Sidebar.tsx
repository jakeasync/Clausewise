"use client";

import React from "react";
import {
  Home,
  FileText,
  Check,
  BarChart2,
  Download,
  Search
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  selectedBatch: string | null;
  onSelectBatch: (batch: string | null) => void;
  onOpenSearch: () => void;
  pendingReviewCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  selectedBatch,
  onSelectBatch,
  onOpenSearch,
  pendingReviewCount
}: SidebarProps) {
  const batches = [
    { id: "Tuning set", label: "Tuning set", color: "#3cb88a" },
    { id: "Held out set", label: "Held out set", color: "#4c7bf0" },
    { id: "Scanned copies", label: "Scanned copies", color: "#f08a24" }
  ];

  return (
    <aside className="side">
      <div className="ws">
        <div className="logo">C</div>
        <div>
          <b>Clausewise</b>
          <small>Contract review</small>
        </div>
      </div>

      <button className="sbox" onClick={onOpenSearch} type="button">
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />
        </svg>
        <span>Search</span>
        <span>Ctrl K</span>
      </button>

      <nav aria-label="Main">
        <p className="grp">Workspace</p>
        <button
          type="button"
          className={`nav-link ${currentTab === "overview" ? "on" : ""}`}
          onClick={() => {
            onSelectTab("overview");
            onSelectBatch(null);
          }}
        >
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11l9-8 9 8M5 10v10h14V10" />
          </svg>
          Overview
        </button>

        <button
          type="button"
          className={`nav-link ${currentTab === "contracts" ? "on" : ""}`}
          onClick={() => {
            onSelectTab("contracts");
            onSelectBatch(null);
          }}
        >
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6" />
          </svg>
          Contracts
        </button>

        <button
          type="button"
          className={`nav-link ${currentTab === "review-queue" ? "on" : ""}`}
          onClick={() => {
            onSelectTab("review-queue");
            onSelectBatch(null);
          }}
        >
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11" />
          </svg>
          Review queue
          {pendingReviewCount > 0 && <em id="open">{pendingReviewCount}</em>}
        </button>

        <button
          type="button"
          className={`nav-link ${currentTab === "evaluation" ? "on" : ""}`}
          onClick={() => {
            onSelectTab("evaluation");
            onSelectBatch(null);
          }}
        >
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </svg>
          Evaluation
        </button>

        <button
          type="button"
          className={`nav-link ${currentTab === "exports" ? "on" : ""}`}
          onClick={() => {
            onSelectTab("exports");
            onSelectBatch(null);
          }}
        >
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
          </svg>
          Exports
        </button>
      </nav>

      <nav aria-label="Batches">
        <p className="grp">Batches</p>
        {batches.map((batch) => {
          const isSelected = selectedBatch === batch.id;
          return (
            <button
              key={batch.id}
              type="button"
              className={`nav-link ${isSelected ? "on" : ""}`}
              onClick={() => {
                if (isSelected) onSelectBatch(null);
                else {
                  onSelectBatch(batch.id);
                  onSelectTab("review-queue");
                }
              }}
            >
              <span className="dot" style={{ background: batch.color }} />
              {batch.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
