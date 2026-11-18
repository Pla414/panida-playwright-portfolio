/**
 * user-journey.cases.ts — test case details of e2e/ui/user-journey.spec.ts for the Excel test result.
 */
import type { SuiteSpec } from "./test-case.types";

export const USER_JOURNEY_SUITE: SuiteSpec = {
  specPath: "e2e/ui/user-journey.spec.ts",
  filePrefix: "TestResult_UserJourney",
  ticket: "E2E - User journey",
  topic: "SauceDemo - end-to-end customer journeys across login, product list, cart and checkout",
  module: "SauceDemo",
  subject: "User journey",
  role: "Guest → StandardUser",
  preconditions: "1. Starts without a session (AS_GUEST) and logs in through the UI\n2. Test data: e2e/test-data/user-journey.json\n3. Products and prices are picked from the page",
  cases: [
    { tsn: "UJ01", priority: "Critical", category: "Positive", topic: "End-to-end journey", description: "New customer buys the cheapest products", dataTest: "2 cheapest products after sort 'Price (low to high)'", expected: "1. Cart and overview list the 2 cheapest products\n2. Totals add up\n3. Order completes, Back Home shows an empty cart\n4. Logout blocks the product page" },
    { tsn: "UJ02", priority: "High", category: "Positive", topic: "End-to-end journey", description: "Customer edits the cart before buying", dataTest: "Add 3 → remove 1 → continue shopping → add 1", expected: "1. Cart shows the final 3 products\n2. Overview lists the same products\n3. Order completes" },
    { tsn: "UJ03", priority: "High", category: "Negative", topic: "End-to-end journey", description: "Customer recovers from input mistakes", dataTest: "Wrong password, then empty postal code", expected: "1. Each mistake shows its error\n2. After fixing it the customer can continue\n3. Order completes" },
  ],
};
