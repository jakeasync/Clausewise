import os
import json
import urllib.request
import zipfile

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
CONTRACTS_DIR = os.path.join(DATA_DIR, "contracts")
GROUND_TRUTH_FILE = os.path.join(DATA_DIR, "ground_truth.json")

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

SAMPLE_CUAD_CONTRACTS = [
    {
        "id": "cuad-01",
        "title": "Northwind Logistics Master Services Agreement",
        "batch": "tuning",
        "text": """MASTER SERVICES AGREEMENT
Effective Date: January 15, 2024.
Parties: Northwind Logistics Inc. and Customer.

1. TERM AND EXPIRATION
This Agreement commences on the Effective Date and shall continue until 31 December 2028 ("Expiration Date").
Renewal Term: This Agreement shall renew automatically for successive periods of 1 year each, unless either party provides 60 days notice.

2. TERMINATION FOR CONVENIENCE
Either party may terminate this Agreement without cause upon giving ninety (90) days prior written notice.

3. LIMITATION OF LIABILITY
In no event shall either party's cumulative aggregate liability under this Agreement exceed the total fees paid by Customer during the prior 12 months preceding the claim.

4. AUDIT RIGHTS
Customer may audit Northwind's financial and performance records once per calendar year upon thirty (30) days prior written demand.

5. NON-COMPETE AND EXCLUSIVITY
During the term of this Agreement and for twelve (12) months thereafter, Customer shall not directly solicit Northwind's core freight logistics personnel.
Northwind is appointed as Customer's exclusive multimodal carrier in the designated region.

6. ANTI-ASSIGNMENT
Neither party may assign or transfer this Agreement or any rights without prior written consent of the other party.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of New York, USA.""",
        "labels": {
            "Governing Law": {"present": True, "value": "State of New York, USA", "quote": "laws of the State of New York, USA"},
            "Termination for Convenience": {"present": True, "value": "Either party, 90 days prior written notice", "quote": "Either party may terminate this Agreement without cause upon giving ninety (90) days prior written notice."},
            "Cap on Liability": {"present": True, "value": "Total fees paid during the prior 12 months", "quote": "exceed the total fees paid by Customer during the prior 12 months"},
            "Audit Rights": {"present": True, "value": "Once per calendar year upon 30 days demand", "quote": "Customer may audit Northwind's financial and performance records once per calendar year upon thirty (30) days prior written demand."},
            "Non-Compete": {"present": True, "value": "12 months non-solicit for freight personnel", "quote": "for twelve (12) months thereafter, Customer shall not directly solicit Northwind's core freight logistics personnel"},
            "Exclusivity": {"present": True, "value": "Exclusive multimodal carrier", "quote": "Northwind is appointed as Customer's exclusive multimodal carrier in the designated region."},
            "Anti-Assignment": {"present": True, "value": "Prior written consent required", "quote": "Neither party may assign or transfer this Agreement or any rights without prior written consent of the other party."},
            "Renewal Term": {"present": True, "value": "Automatic 1 year renewal", "quote": "renew automatically for successive periods of 1 year each"},
            "Expiration Date": {"present": True, "value": "31 December 2028", "quote": "shall continue until 31 December 2028"},
            "Effective Date": {"present": True, "value": "January 15, 2024", "quote": "Effective Date: January 15, 2024"}
        }
    },
    {
        "id": "cuad-02",
        "title": "Harbor Warehouse Lease Agreement",
        "batch": "held_out",
        "text": """COMMERCIAL PROPERTY LEASE
Effective as of November 1, 2024.
Premises: Harbor Facility Pier 14.

SECTION 1. LEASE TERM
The initial term shall expire on 31 December 2029.
Option to Renew: Tenant is granted one renewal of 2 years upon 180 days advance notice.

SECTION 2. TERMINATION
Landlord may terminate immediately upon incurable default. There is no termination for convenience permitted under this lease.

SECTION 3. ASSIGNMENT
Tenant shall not assign or sublease any portion of the premises without Landlord's express written consent.

SECTION 4. GOVERNING LAW
This Lease shall be governed by the laws of the Commonwealth of Massachusetts.

SECTION 5. LIABILITY
Landlord's liability for property damages shall be capped at three (3) months of Base Rent.""",
        "labels": {
            "Governing Law": {"present": True, "value": "Commonwealth of Massachusetts", "quote": "laws of the Commonwealth of Massachusetts"},
            "Termination for Convenience": {"present": False, "value": "None", "quote": ""},
            "Cap on Liability": {"present": True, "value": "Three months of Base Rent", "quote": "capped at three (3) months of Base Rent"},
            "Audit Rights": {"present": False, "value": "None", "quote": ""},
            "Non-Compete": {"present": False, "value": "None", "quote": ""},
            "Exclusivity": {"present": False, "value": "None", "quote": ""},
            "Anti-Assignment": {"present": True, "value": "Landlord express written consent required", "quote": "without Landlord's express written consent"},
            "Renewal Term": {"present": True, "value": "One renewal of 2 years", "quote": "one renewal of 2 years upon 180 days advance notice"},
            "Expiration Date": {"present": True, "value": "31 December 2029", "quote": "expire on 31 December 2029"},
            "Effective Date": {"present": True, "value": "November 1, 2024", "quote": "Effective as of November 1, 2024"}
        }
    },
    {
        "id": "cuad-03",
        "title": "Pacific Rim Distribution Scan",
        "batch": "held_out",
        "text": """DISTRIBUTION & EXCLUSIVITY AGREEMENT
Date of execution: February 10, 2024.

CLAUSE 1. EXCLUSIVITY APPOINTMENT
Supplier grants Distributor the exclusive right to distribute the Hardware Products in Southeast Asia.

CLAUSE 2. AUDIT RIGHTS
Distributor records may be inspected by an independent certified accountant once semi-annually upon 14 business days notice.

CLAUSE 3. GOVERNING LAW AND FORUM
Governed under the laws of the Republic of Singapore.

CLAUSE 4. TERM
Expires on 31 December 2027.""",
        "labels": {
            "Governing Law": {"present": True, "value": "Republic of Singapore", "quote": "laws of the Republic of Singapore"},
            "Termination for Convenience": {"present": False, "value": "None", "quote": ""},
            "Cap on Liability": {"present": False, "value": "None", "quote": ""},
            "Audit Rights": {"present": True, "value": "Semi-annually, 14 business days notice", "quote": "once semi-annually upon 14 business days notice"},
            "Non-Compete": {"present": False, "value": "None", "quote": ""},
            "Exclusivity": {"present": True, "value": "Exclusive right in Southeast Asia", "quote": "exclusive right to distribute the Hardware Products in Southeast Asia"},
            "Anti-Assignment": {"present": False, "value": "None", "quote": ""},
            "Renewal Term": {"present": False, "value": "None", "quote": ""},
            "Expiration Date": {"present": True, "value": "31 December 2027", "quote": "Expires on 31 December 2027"},
            "Effective Date": {"present": True, "value": "February 10, 2024", "quote": "Date of execution: February 10, 2024"}
        }
    }
]

def setup_dataset():
    os.makedirs(CONTRACTS_DIR, exist_ok=True)
    ground_truth = {}

    for c in SAMPLE_CUAD_CONTRACTS:
        filename = f"{c['id']}_{c['batch']}.txt"
        filepath = os.path.join(CONTRACTS_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(c["text"])
        
        ground_truth[c["id"]] = {
            "title": c["title"],
            "batch": c["batch"],
            "filename": filename,
            "labels": c["labels"]
        }

    with open(GROUND_TRUTH_FILE, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Successfully generated {len(SAMPLE_CUAD_CONTRACTS)} CUAD test contracts in {CONTRACTS_DIR}")
    print(f"Ground truth dataset saved to {GROUND_TRUTH_FILE}")

if __name__ == "__main__":
    setup_dataset()
