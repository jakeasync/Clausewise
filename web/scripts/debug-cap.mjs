async function test() {
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

  const res = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: NORTHWIND, filename: 'northwind.pdf' })
  });
  const data = await res.json();
  console.log('CAP CLAUSE RESULT:', data.doc?.clauses?.cap_on_liability);
}
test();
