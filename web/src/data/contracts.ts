export interface ClauseItem {
  id: string;
  contractId: string;
  clauseType: string;
  extractedValue: string;
  result: "Found" | "Not found";
  source: string;
  sourceQuote: string;
  confidence: number; // 0 - 100
  status: "Ready to check" | "Needs review" | "Confirmed" | "Corrected";
  validationCheck: {
    schemaValid: boolean;
    quoteMatches: boolean;
    quoteCharOffset?: [number, number];
  };
  notes?: string;
}

export interface Contract {
  id: string;
  name: string;
  batch: "Tuning set" | "Held out set" | "Scanned copies";
  fileType: "PDF" | "Scan (OCR)" | "Text";
  uploadedAt: string;
  clauses: ClauseItem[];
  fullTextSnippet: string;
}

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "cnt-1",
    name: "Northwind Logistics MSA",
    batch: "Tuning set",
    fileType: "PDF",
    uploadedAt: "2026-10-10 14:22",
    fullTextSnippet: `MASTER SERVICES AGREEMENT
This Master Services Agreement is entered into by and between Northwind Logistics Inc. and Customer.

SECTION 1. DEFINITIONS AND EFFECTIVE DATE
This Agreement becomes effective as of January 15, 2024 ("Effective Date").

SECTION 2. TERM AND TERMINATION
Either party may terminate this Agreement for convenience upon providing at least sixty (60) days prior written notice to the other party.

SECTION 3. LIMITATION OF LIABILITY
Except for breaches of Section 6 (Confidentiality), each party's total aggregate liability under this Agreement shall not exceed the total fees paid by Customer in the prior twelve (12) months preceding the incident giving rise to liability.

SECTION 4. AUDIT RIGHTS
Customer may, once per calendar year upon thirty (30) days advance notice, inspect Northwind's security and compliance records.

SECTION 5. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by, and construed in accordance with, the laws of the Republic of the Philippines, without regard to its conflict of law principles.

SECTION 6. CONFIDENTIALITY
Each party agrees to maintain strict confidentiality of proprietary data.`,
    clauses: [
      {
        id: "c-101",
        contractId: "cnt-1",
        clauseType: "Governing law",
        extractedValue: "Republic of the Philippines",
        result: "Found",
        source: "Section 5",
        sourceQuote: "This Agreement shall be governed by, and construed in accordance with, the laws of the Republic of the Philippines",
        confidence: 97,
        status: "Ready to check",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [670, 781]
        }
      },
      {
        id: "c-102",
        contractId: "cnt-1",
        clauseType: "Termination for convenience",
        extractedValue: "Either party, 60 days written notice",
        result: "Found",
        source: "Section 2",
        sourceQuote: "Either party may terminate this Agreement for convenience upon providing at least sixty (60) days prior written notice to the other party.",
        confidence: 88,
        status: "Ready to check",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [251, 385]
        }
      },
      {
        id: "c-103",
        contractId: "cnt-1",
        clauseType: "Cap on liability",
        extractedValue: "Fees paid in the prior 12 months",
        result: "Found",
        source: "Section 3",
        sourceQuote: "each party's total aggregate liability under this Agreement shall not exceed the total fees paid by Customer in the prior twelve (12) months",
        confidence: 61,
        status: "Needs review",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [448, 584]
        },
        notes: "Confidence flagged: contains carve-outs for confidentiality breaches."
      },
      {
        id: "c-104",
        contractId: "cnt-1",
        clauseType: "Non-compete",
        extractedValue: "Not in this contract",
        result: "Not found",
        source: "None",
        sourceQuote: "",
        confidence: 90,
        status: "Ready to check",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true
        },
        notes: "Correct abstention: verified absence in all standard operational covenants."
      }
    ]
  },
  {
    id: "cnt-2",
    name: "Harbor Warehouse Lease",
    batch: "Held out set",
    fileType: "PDF",
    uploadedAt: "2026-10-10 11:05",
    fullTextSnippet: `COMMERCIAL PROPERTY LEASE AGREEMENT
Premises: Pier 14 Harbor Storage Complex.

SECTION 1. LEASE TERM AND EXPIRATION
The primary term of this Lease commences October 1, 2024 and expires on 31 December 2029, unless terminated earlier in accordance with the provisions hereof.

SECTION 2. RENT AND DEPOSIT
Monthly base rent of $14,500 due on the first day of each calendar month.

SECTION 3. USE OF PREMISES
The premises shall be used solely for dry goods staging, fulfillment, and maritime storage.

SECTION 4. OPTION TO RENEW
Tenant shall have the option for one renewal of 2 years upon delivering notice at least one hundred eighty (180) days prior to the expiration date.

SECTION 9. ASSIGNMENT AND SUBLETTING
Tenant shall not assign, sublet, or transfer this Lease or any interest herein without prior written Landlord consent required, which shall not be unreasonably withheld.`,
    clauses: [
      {
        id: "c-201",
        contractId: "cnt-2",
        clauseType: "Renewal term",
        extractedValue: "One renewal of 2 years",
        result: "Found",
        source: "Section 4",
        sourceQuote: "Tenant shall have the option for one renewal of 2 years upon delivering notice at least one hundred eighty (180) days prior to the expiration date.",
        confidence: 93,
        status: "Ready to check",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [421, 563]
        }
      },
      {
        id: "c-202",
        contractId: "cnt-2",
        clauseType: "Anti-assignment",
        extractedValue: "Landlord consent required",
        result: "Found",
        source: "Section 9",
        sourceQuote: "Tenant shall not assign, sublet, or transfer this Lease or any interest herein without prior written Landlord consent required",
        confidence: 74,
        status: "Needs review",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [610, 735]
        },
        notes: "Flagged: includes qualification 'which shall not be unreasonably withheld'."
      },
      {
        id: "c-203",
        contractId: "cnt-2",
        clauseType: "Expiration date",
        extractedValue: "31 December 2029",
        result: "Found",
        source: "Section 1",
        sourceQuote: "expires on 31 December 2029, unless terminated earlier in accordance with the provisions hereof.",
        confidence: 96,
        status: "Confirmed",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [142, 236]
        }
      }
    ]
  },
  {
    id: "cnt-3",
    name: "Pacific Rim Distribution Scan",
    batch: "Scanned copies",
    fileType: "Scan (OCR)",
    uploadedAt: "2026-10-09 17:40",
    fullTextSnippet: `DISTRIBUTION AND SUPPLY AGREEMENT [SCANNED REVISION 2.1]
Executed between Pacific Rim Tech and Global Distro Corp.

CLAUSE 7. AUDIT RIGHTS
Supplier grants Distributor the right to audit financial transactions twice per fiscal year upon fifteen (15) business days written demand.

CLAUSE 11. EXCLUSIVITY
During the Term, Distributor shall be the exclusive distributor of Products within the territory of Southeast Asia and Oceania.

CLAUSE 14. GOVERNING LAW
Governed exclusively by the laws of the State of Delaware, United States.`,
    clauses: [
      {
        id: "c-301",
        contractId: "cnt-3",
        clauseType: "Exclusivity",
        extractedValue: "Exclusive distributor in Southeast Asia and Oceania",
        result: "Found",
        source: "Clause 11",
        sourceQuote: "Distributor shall be the exclusive distributor of Products within the territory of Southeast Asia and Oceania.",
        confidence: 92,
        status: "Ready to check",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [265, 375]
        }
      },
      {
        id: "c-302",
        contractId: "cnt-3",
        clauseType: "Audit rights",
        extractedValue: "Twice per fiscal year, 15 business days demand",
        result: "Found",
        source: "Clause 7",
        sourceQuote: "Supplier grants Distributor the right to audit financial transactions twice per fiscal year upon fifteen (15) business days written demand.",
        confidence: 85,
        status: "Needs review",
        validationCheck: {
          schemaValid: true,
          quoteMatches: true,
          quoteCharOffset: [130, 263]
        },
        notes: "OCR artifact detected in scanned header: 'Distributor' slightly skewed font."
      }
    ]
  }
];

export interface EvaluationMetric {
  clauseType: string;
  precision: number;
  recall: number;
  f1: number;
  abstention: number;
  sampleCount: number;
  notes: string;
}

export const EVALUATION_METRICS: EvaluationMetric[] = [
  { clauseType: "Governing Law", precision: 96.4, recall: 98.1, f1: 97.2, abstention: 99.0, sampleCount: 52, notes: "Consistent phrasings, high accuracy." },
  { clauseType: "Termination for Convenience", precision: 91.8, recall: 89.5, f1: 90.6, abstention: 94.2, sampleCount: 48, notes: "Occasional notice period parsing ambiguity." },
  { clauseType: "Cap on Liability", precision: 87.2, recall: 84.1, f1: 85.6, abstention: 91.0, sampleCount: 50, notes: "Carve-out exceptions require quote span validation." },
  { clauseType: "Audit Rights", precision: 90.0, recall: 88.0, f1: 89.0, abstention: 93.5, sampleCount: 45, notes: "Well delineated in service and IP agreements." },
  { clauseType: "Non-Compete", precision: 92.5, recall: 94.0, f1: 93.2, abstention: 97.4, sampleCount: 50, notes: "High abstention accuracy when absent." },
  { clauseType: "Exclusivity", precision: 88.6, recall: 85.2, f1: 86.9, abstention: 92.1, sampleCount: 42, notes: "Territory and channel scoping variations." },
  { clauseType: "Anti-Assignment", precision: 89.3, recall: 91.0, f1: 90.1, abstention: 95.0, sampleCount: 49, notes: "Standard boilerplate; reliable recall." },
  { clauseType: "Renewal Term", precision: 86.4, recall: 83.7, f1: 85.0, abstention: 90.5, sampleCount: 46, notes: "Automatic evergreen clauses vs manual renewal options." },
  { clauseType: "Expiration Date", precision: 94.7, recall: 93.1, f1: 93.9, abstention: 96.8, sampleCount: 51, notes: "Strict date formatting verified by Pydantic parser." },
  { clauseType: "Effective Date", precision: 97.0, recall: 96.5, f1: 96.7, abstention: 98.5, sampleCount: 52, notes: "Typically present in opening recital." }
];

export interface ParserComparison {
  method: string;
  accuracy: string;
  costPerDoc: string;
  latencySeconds: string;
  scannedSupport: string;
  bestFor: string;
}

export const PARSER_COMPARISONS: ParserComparison[] = [
  {
    method: "Plain Text Extraction",
    accuracy: "94.2% F1 (text-only)",
    costPerDoc: "$0.012",
    latencySeconds: "1.4s",
    scannedSupport: "No (fails on scans)",
    bestFor: "Born-digital searchable contracts with straightforward layouts."
  },
  {
    method: "Amazon Textract OCR -> Claude Bedrock",
    accuracy: "91.8% F1 (hybrid)",
    costPerDoc: "$0.048",
    latencySeconds: "4.8s",
    scannedSupport: "Yes (robust OCR)",
    bestFor: "Mixed workflows containing scanned leases, signed amendments, and multi-column layouts."
  },
  {
    method: "Direct Page Images -> Multimodal Claude",
    accuracy: "93.4% F1 (visual layout)",
    costPerDoc: "$0.092",
    latencySeconds: "6.2s",
    scannedSupport: "Yes (native vision)",
    bestFor: "Complex contract stamp seals, side margins, and handwritten signatures."
  }
];
