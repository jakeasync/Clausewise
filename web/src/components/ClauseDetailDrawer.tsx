"use client";

import React, { useState, useEffect } from "react";
import { ClauseItem, Contract } from "../data/contracts";

interface ClauseDetailDrawerProps {
  clause: ClauseItem | null;
  contract: Contract | null;
  onClose: () => void;
  onUpdateClause: (updatedClause: ClauseItem) => void;
}

export function ClauseDetailDrawer({
  clause,
  contract,
  onClose,
  onUpdateClause
}: ClauseDetailDrawerProps) {
  const [editedValue, setEditedValue] = useState("");

  useEffect(() => {
    if (clause) {
      setEditedValue(clause.extractedValue);
    }
  }, [clause]);

  if (!clause || !contract) return null;

  const isAbsent = clause.result === "Not found";

  const handleSave = () => {
    const v = editedValue.trim();
    if (v && v !== clause.extractedValue) {
      onUpdateClause({
        ...clause,
        extractedValue: v,
        status: "Corrected"
      });
    }
    onClose();
  };

  const handleConfirm = () => {
    onUpdateClause({
      ...clause,
      status: "Confirmed"
    });
    onClose();
  };

  const renderSourceContent = () => {
    if (isAbsent || !clause.sourceQuote) {
      return (
        <>
          <p className="lab">Source text</p>
          <p className="src">
            No matching text found. The model returned &quot;not present&quot; for this clause.
          </p>
        </>
      );
    }

    const text = contract.fullTextSnippet;
    const quote = clause.sourceQuote;
    const index = text.indexOf(quote);

    if (index === -1) {
      return (
        <>
          <p className="lab">Source text, {clause.source}</p>
          <p className="src">
            <mark>{quote}</mark>
          </p>
        </>
      );
    }

    const before = text.substring(0, index);
    const matched = text.substring(index, index + quote.length);
    const after = text.substring(index + quote.length);

    return (
      <>
        <p className="lab">Source text, {clause.source}</p>
        <p className="src">
          {before}
          <mark>{matched}</mark>
          {after}
        </p>
      </>
    );
  };

  return (
    <aside className="drawer open" aria-label="Clause details">
      {/* Drawer Header */}
      <div className="dh">
        <div>
          <h3 id="dt">{clause.clauseType}</h3>
          <small id="ds">{contract.name}</small>
        </div>
        <button className="x" id="dx" aria-label="Close details" onClick={onClose} type="button">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="db" id="dbody">
        {clause.notes && clause.status === "Needs review" && (
          <div className="warn">{clause.notes}</div>
        )}

        {renderSourceContent()}

        <label className="lab" htmlFor="v">
          Extracted value
        </label>
        <input
          id="v"
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          disabled={isAbsent}
        />
      </div>

      {/* Drawer Footer */}
      <div className="df" id="dfoot">
        <button className="btn" id="sv" onClick={handleSave} type="button">
          Save changes
        </button>
        <button className="btn dark" id="cf" onClick={handleConfirm} type="button">
          {isAbsent ? "Confirm not found" : "Confirm"}
        </button>
      </div>
    </aside>
  );
}
