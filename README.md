# Clausewise: Contract Document Intelligence Pipeline

Clausewise turns commercial contracts (text PDFs and scans) into validated, structured clause data, then measures how accurate and how expensive that extraction is.

## Architecture

```
Review UI (Next.js 16 + React 19 + TypeScript)
        |
        v
FastAPI service on ECS Fargate
        |
        |  upload                        results
        v                                  ^
   S3 (contracts)                    S3 (JSON results)
        |                                  ^
        v                                  |
   SQS queue ----> Worker (same container image)
                        |
                        |-- text extraction (Textract for scans)
                        |-- Claude on Amazon Bedrock, structured output
                        |-- Pydantic schema validation
                        |-- quote check (does the quote exist in the text?)
                        |
                        v
              valid and confident: store result
              invalid or low confidence: flag for human review
```

## Review UI Features

- **Review Queue Interface**: Directly reflects the human-in-the-loop verification pipeline for extracted commercial clauses.
- **Automated Validation Engine**:
  - **Schema check (Pydantic v2)**: Rejects malformed JSON and enforces strict typing.
  - **Quote check**: Grounding verification that tests whether the exact extracted quote exists in the source contract, stopping invented/hallucinated clauses.
- **Evaluation Benchmark View**:
  - Macro Precision, Recall, F1 score, and Correct Abstention rate across 10 core CUAD clause categories.
  - Architecture trade-off comparison between **Textract OCR + Claude Bedrock**, **Direct Page Images to Multimodal Claude**, and **Plain Text Extraction**.
- **Interactive Inspection Drawer**: Highlights matching quotes directly in the source document context.
- **Contract Ingestion Modal**: Simulates S3 upload, OCR text extraction, Bedrock inference, and Pydantic validation.
- **Export System**: Downloads full clause datasets with source grounding in JSON and CSV formats.
- **Keyboard Shortcuts**: `Ctrl+K` for instant command palette search across contracts and clauses.

## Running the Web Review UI

```bash
cd web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
