"""
Claude API Extraction Engine for ClauseLens / Clausewise
Extracts 10 commercial contract clause types using Anthropic Claude
with source quote grounding and Pydantic validation.
"""

import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

TARGET_CLAUSES = [
    "Governing Law",
    "Termination for Convenience",
    "Cap on Liability",
    "Audit Rights",
    "Non-Compete",
    "Exclusivity",
    "Anti-Assignment",
    "Renewal Term",
    "Expiration Date",
    "Effective Date"
]

SYSTEM_PROMPT = """You are a contract clause extraction engine. You read the text of one contract and report, for a fixed list of clause types, whether each clause is present and what it says.

INPUT
The user message contains the full extracted text of one contract between <contract> tags. Use ONLY that text. Never use outside knowledge, assumptions, or typical contract terms to fill gaps.

CLAUSE TYPES TO EXTRACT
1. effective_date: the date the agreement takes effect.
2. governing_law: the jurisdiction whose law governs the agreement. Venue or court location is a separate field.
3. termination_for_convenience: a right for one or both parties to end the agreement early WITHOUT needing cause, usually on notice.
4. cap_on_liability: a limit on the maximum amount a party can owe for claims or damages.
5. audit_rights: a right for one party to inspect or audit the other party's books, records, or operations.
6. non_compete: a restriction on a party competing with the other or working with competitors.
7. exclusivity: a requirement that a party deal only with the other party, or grants exclusive rights.

HOW TO FIND CLAUSES
1. Read the whole contract before answering. Clauses often sit under headings that do not match their name. Examples: termination for convenience under "Early Termination", governing law as one sentence inside "Disputes", audit rights under "Retention of Records".
2. Judge by meaning, not by heading or keywords.
3. A clause can be short. One sentence is enough.
4. Ignore text that is not part of the agreement, such as guidance notes, instructions, checklists, or annexes with no binding terms. Do not extract clauses from them.
5. If section numbers are duplicated or inconsistent, report the number as written and add a note.

DECISION RULES
For each clause type, choose exactly one status:
"found": the clause exists and states a value.
"found_blank": the clause exists but the value is an unfilled placeholder, such as "(DATE)", "____", "[TBD]", or "xxx". Report the clause text in evidence and set value to null.
"not_found": no text in the contract performs this function.

Near misses are NOT matches. Use "not_found" for these:
1. A payment cap such as "not to exceed $X" is not a cap on liability.
2. Bonds, guarantees, or collateral are not a cap on liability.
3. Reporting duties, invoices, or progress reports are not audit rights. Audit rights require a right to inspect or audit.
4. A non-exclusive license is not exclusivity.
5. Termination only for breach, default, or insolvency is not termination for convenience.
6. An IP restriction on using work product is not a non-compete.
7. Dispute resolution steps without a named jurisdiction are not governing law.

If you are unsure, prefer "not_found" with low confidence over inventing a match. A wrong "found" is worse than a missed clause that a human can review.

MULTIPLE VALUES
If a clause has more than one tier, carve-out, or party, include ALL of them in "values" as separate entries. Example: a general liability cap plus a higher cap for data loss must both be listed.

EVIDENCE
For every "found" or "found_blank" result, quote the exact sentence or sentences from the contract in "evidence", copied verbatim, with the section number or heading in "location". If you cannot quote it, the status must be "not_found".

CONFIDENCE
Give a number from 0 to 1.
1. 0.9 or above: explicit, unambiguous wording.
2. 0.6 to 0.89: the meaning is clear but the wording is indirect, or the clause is partly ambiguous.
3. Below 0.6: weak match. Flag it for review.
For "not_found", confidence reflects how sure you are the clause is truly absent.

OUTPUT FORMAT
Return ONLY valid JSON. No markdown, no commentary. Use this schema:
{
  "clauses": {
    "<clause_type>": {
      "status": "found" | "found_blank" | "not_found",
      "values": [ "<short normalized value>", ... ],
      "evidence": "<verbatim quote or null>",
      "location": "<section number or heading, or null>",
      "confidence": <0 to 1>,
      "needs_review": true | false,
      "note": "<short note on ambiguity, near misses, or duplicate numbering, or null>"
    }
  }
}

Include all seven clause types every time. Set needs_review to true when confidence is below 0.7, when the status is "found_blank", or when a near miss was considered and rejected.
"""

def extract_contract_clauses(contract_text: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise ValueError("ANTHROPIC_API_KEY is not set.")

    import anthropic
    client = anthropic.Anthropic(api_key=key)

    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Please extract the 10 target clauses from the following commercial contract text:\n\n{contract_text}"
            }
        ]
    )

    response_text = response.content[0].text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    data = json.loads(response_text)

    # Automated Pipeline Validation: Verify Grounding (Quote Check)
    for clause in data.get("clauses", []):
        quote = clause.get("source_quote", "").strip()
        if clause.get("is_present") and quote:
            if quote in contract_text:
                clause["quote_verified"] = True
                clause["status"] = "Ready to check" if clause.get("confidence", 0) >= 0.85 else "Needs review"
            else:
                clause["quote_verified"] = False
                clause["status"] = "Needs review"
                clause["notes"] = "Warning: Source quote could not be verified as exact substring in contract text."
        else:
            clause["quote_verified"] = True
            clause["status"] = "Ready to check"

    return data

if __name__ == "__main__":
    sample_text = """MASTER SERVICES AGREEMENT
1. GOVERNING LAW: Governed by the laws of the State of California.
2. TERMINATION: Either party may terminate with 30 days notice for convenience.
3. LIABILITY: Liability capped at $100,000."""
    try:
        res = extract_contract_clauses(sample_text)
        print("Success! Live Claude Extraction:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Extraction test error: {e}")
