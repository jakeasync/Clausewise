"use client";

import React from "react";
import { Contract, ClauseItem } from "../data/contracts";

interface ContractCardProps {
  contract: Contract;
  onSelectClause: (clause: ClauseItem, contract: Contract) => void;
  selectedClauseId?: string;
  statusFilter: string;
  searchQuery: string;
}

export function ContractCard({
  contract,
  onSelectClause,
  selectedClauseId,
  statusFilter,
  searchQuery
}: ContractCardProps) {
  const filteredClauses = contract.clauses.filter((clause) => {
    const matchesStatus =
      statusFilter === "all" ||
      clause.status.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === "done" && (clause.status === "Confirmed" || clause.status === "Corrected"));

    const matchesSearch =
      searchQuery.trim() === "" ||
      clause.clauseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.extractedValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  if (filteredClauses.length === 0) {
    return null;
  }

  const getMeterColor = (conf: number) => {
    if (conf >= 85) return "var(--m-grn)";
    if (conf >= 70) return "var(--m-amb)";
    return "var(--m-red)";
  };

  const getStatusChip = (status: ClauseItem["status"]) => {
    switch (status) {
      case "Needs review":
        return { chipClass: "c-red", label: "Needs review" };
      case "Ready to check":
        return { chipClass: "c-blue", label: "Ready to check" };
      case "Confirmed":
        return { chipClass: "c-green", label: "Confirmed" };
      case "Corrected":
        return { chipClass: "c-green", label: "Corrected" };
      default:
        return { chipClass: "c-gray", label: status };
    }
  };

  return (
    <div className="group">
      {/* Group Header: Contract Name & Count Pill */}
      <div className="ghead">
        <span>{contract.name}</span>
        <span className="count">{filteredClauses.length}</span>
      </div>

      {/* Sheet Table */}
      <div className="sheet">
        <table>
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Clause</th>
              <th style={{ width: "32%" }}>Extracted value</th>
              <th style={{ width: "13%" }}>Result</th>
              <th style={{ width: "11%" }}>Source</th>
              <th style={{ width: "12%" }}>Confidence</th>
              <th style={{ width: "10%" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredClauses.map((clause) => {
              const isSelected = selectedClauseId === clause.id;
              const isFound = clause.result === "Found";
              const { chipClass, label } = getStatusChip(clause.status);

              return (
                <tr
                  key={clause.id}
                  onClick={() => onSelectClause(clause, contract)}
                  className={isSelected ? "sel" : ""}
                >
                  {/* Clause Name */}
                  <td>{clause.clauseType}</td>

                  {/* Extracted Value */}
                  <td>
                    <div className="val">{clause.extractedValue}</div>
                  </td>

                  {/* Result Chip */}
                  <td>
                    <span className="chip c-gray">
                      {isFound ? (
                        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "inline" }}>
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      ) : (
                        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "inline" }}>
                          <path d="M6 12h12" />
                        </svg>
                      )}
                      <span>{isFound ? "Found" : "Not found"}</span>
                    </span>
                  </td>

                  {/* Source */}
                  <td>{clause.source}</td>

                  {/* Confidence Meter */}
                  <td>
                    <div className="conf">
                      <span className="pct">{Math.round(clause.confidence)}%</span>
                      <span className="meter">
                        <i
                          style={{
                            width: `${clause.confidence}%`,
                            background: getMeterColor(clause.confidence)
                          }}
                        />
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span className={`chip ${chipClass}`}>{label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
