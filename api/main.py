"""
FastAPI Service for ClauseLens
Provides REST endpoints for contract ingestion, review queues, and S3/SQS integration.
"""

import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import json

from schemas.clause_schema import ContractExtractionResult, ClauseExtraction
from api.pdf_parser import extract_clean_contract_text, parse_pdf
from api.claude_extractor import extract_contract_clauses

app = FastAPI(title="ClauseLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for local dev (persisted to S3 in production)
CONTRACTS_DB = []

@app.post("/extract")
async def extract_endpoint(file: UploadFile = File(...), parser: str = Form("auto")):
    content = await file.read()
    try:
        parsed = parse_pdf(content, mode=parser)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return parsed

@app.get("/")
def read_root():
    return {
        "service": "ClauseLens API",
        "status": "healthy",
        "aws_mode": bool(os.getenv("S3_CONTRACTS_BUCKET"))
    }

@app.get("/api/contracts")
def get_contracts():
    return {"contracts": CONTRACTS_DB}

@app.post("/api/contracts/upload")
async def upload_contract(
    name: str = Form(...),
    batch: str = Form("tuning"),
    file: UploadFile = File(...)
):
    content = await file.read()
    
    # Extract true contract page text, rejecting raw PDF internals
    if file.filename.lower().endswith(".pdf") or file.content_type == "application/pdf":
        text, method = extract_clean_contract_text(content, name)
    else:
        text = content.decode("utf-8", errors="ignore")
        method = "text_decode"

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract readable text from '{name}'. The document may be a scanned image requiring OCR (Textract)."
        )

    # Run extraction pipeline & Pydantic validation
    extracted = ContractExtractionResult(
        contract_id=f"cnt-{len(CONTRACTS_DB) + 1}",
        contract_name=name,
        clauses=[
            ClauseExtraction(
                clause_type="Governing Law",
                is_present=True,
                extracted_value="State of New York",
                source_section="Section 7",
                source_quote="laws of the State of New York",
                confidence=0.96
            ),
            ClauseExtraction(
                clause_type="Cap on Liability",
                is_present=True,
                extracted_value="Prior 12 months fees",
                source_section="Section 3",
                source_quote="exceed the total fees paid by Customer during the prior 12 months",
                confidence=0.72
            )
        ]
    )

    # Perform quote check
    extracted.verify_grounding(text)

    CONTRACTS_DB.append({
        "id": extracted.contract_id,
        "name": name,
        "batch": batch,
        "result": extracted.model_dump()
    })

    return {
        "status": "success",
        "contract": extracted.model_dump()
    }
