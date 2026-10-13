"""
Pydantic v2 Schema for ClauseLens Structured Clause Extraction
Enforces strict typing and quote grounding verification.
"""

from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class ClauseExtraction(BaseModel):
    clause_type: str = Field(..., description="Name of the commercial clause")
    is_present: bool = Field(..., description="True if clause is found in contract, False otherwise")
    extracted_value: str = Field(default="Not in this contract", description="Normalized extracted value or terms")
    source_section: Optional[str] = Field(default=None, description="Section heading or clause number")
    source_quote: Optional[str] = Field(default=None, description="Exact substring quote from contract text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score between 0.0 and 1.0")

class ContractExtractionResult(BaseModel):
    contract_id: str
    contract_name: str
    clauses: List[ClauseExtraction]
    all_quotes_valid: bool = Field(default=True, description="Whether all source quotes exist in contract text")
    needs_human_review: bool = Field(default=False, description="Flagged if low confidence or quote check failed")

    def verify_grounding(self, full_contract_text: str) -> None:
        """
        Quote check: verifies that each reported source quote actually
        appears as an exact substring in the contract text.
        """
        for clause in self.clauses:
            if clause.is_present and clause.source_quote:
                if clause.source_quote.strip() not in full_contract_text:
                    self.all_quotes_valid = False
                    self.needs_human_review = True
                    clause.confidence = min(clause.confidence, 0.4)
            if clause.confidence < 0.75:
                self.needs_human_review = True
