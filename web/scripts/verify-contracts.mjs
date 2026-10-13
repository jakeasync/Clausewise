async function runVerification() {
  const SHUTTLE_FULL = `SAMPLE CONTRACT
This contract (The Agreement) is effective (Date) between Commission and Consultant.

Section 4. Early Termination
A. Commission may terminate this Agreement for its convenience any time, in whole or part, by giving Consultant thirty-day written notice.

Section 12. Retention and Audit of Records
Commission and state or federal auditors shall have access to books, records, and documents for audit.

Section 18. Disputes
This Agreement shall be construed under the laws of the State of California.`;

  const res1 = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: SHUTTLE_FULL, filename: 'shuttle-full.pdf' })
  });
  const data1 = await res1.json();
  console.log('=== SHUTTLE EXTRACT OUTPUT ===');
  console.log('Doc ID:', data1.doc?.id);
  console.log('Text Hash:', data1.doc?.textHash);
  console.log(JSON.stringify(data1.doc?.clauses, null, 2));

  const NORTHWIND = `MASTER SERVICES AGREEMENT
This Master Services Agreement is entered into between Northwind Logistics Inc. and Customer.

1. Term and Effective Date
This Agreement takes effect on 1 March 2026.

2. Termination for Convenience
Either party may terminate this Agreement for convenience by giving 60 days written notice to the other party.

3. Limitation of Liability
The Provider's total liability under this Agreement is limited to the fees paid in the twelve months before the claim. For claims arising from data loss, the limit is PHP 5,000,000.

4. Audit Rights
Customer may audit the Provider's relevant records once per calendar year on 10 business days notice.

5. Governing Law
This Agreement is governed by the laws of the Republic of the Philippines.`;

  const res2 = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: NORTHWIND, filename: 'northwind-msa.pdf' })
  });
  const data2 = await res2.json();
  console.log('\n=== NORTHWIND (TIERED LIABILITY CAP) OUTPUT ===');
  console.log('Doc ID:', data2.doc?.id);
  console.log('Cap on liability values:', data2.doc?.clauses?.cap_on_liability?.modelValues);
  console.log('Cap on liability status:', data2.doc?.clauses?.cap_on_liability?.modelStatus);
  console.log('Cap on liability grounded:', data2.doc?.clauses?.cap_on_liability?.grounded);
  console.log('Cap on liability evidence:', data2.doc?.clauses?.cap_on_liability?.evidence);
}

runVerification();
