/**
 * checkout.cases.ts — test case details of e2e/ui/checkout.spec.ts for the Excel test result.
 */
import type { SuiteSpec } from "./test-case.types";

const requiredCase = (tsn: string, field: string, label: string) => ({
  tsn,
  priority: "High" as const,
  category: "Negative" as const,
  topic: "Validation",
  description: `Checkout requires ${field}`,
  dataTest: `Customer info with ${field} empty`,
  expected: `Error '${label} is required' and the user stays on step one`,
});

export const CHECKOUT_SUITE: SuiteSpec = {
  specPath: "e2e/ui/checkout.spec.ts",
  filePrefix: "TestResult_Checkout",
  ticket: "Regression - Checkout",
  topic: "SauceDemo (/checkout-*) - full purchase with price checks and required field validation",
  module: "SauceDemo",
  subject: "Checkout",
  role: "StandardUser",
  preconditions: "1. Logged in as ROLES.StandardUser (saved session, empty cart)\n2. Test data: e2e/test-data/checkout.json\n3. Prices and totals are read from the page",
  cases: [
    { tsn: "CO01", priority: "Critical", category: "Positive", topic: "Purchase", description: "Complete a purchase end to end", dataTest: "Backpack + Fleece Jacket / Panida Banyen 10110", expected: "1. Overview prices = shelf prices\n2. Item total = sum of prices, Total = Item total + Tax\n3. 'Thank you for your order!' and the cart is empty" },
    requiredCase("CO02", "firstName", "First Name"),
    requiredCase("CO03", "lastName", "Last Name"),
    requiredCase("CO04", "postalCode", "Postal Code"),
  ],
};
