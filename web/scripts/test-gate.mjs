import { GATES } from "../src/lib/review/validate.ts";

const ev = "The Provider's total liability under this Agreement is limited to the fees paid in the twelve months before the claim. For claims arising from data loss, the limit is PHP 5,000,000.";

console.log("gate:", GATES.cap_on_liability);
console.log("test:", GATES.cap_on_liability.test(ev));
