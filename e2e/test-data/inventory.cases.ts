/**
 * inventory.cases.ts — test case details of e2e/ui/inventory.spec.ts for the Excel test result.
 */
import type { SuiteSpec } from "./test-case.types";

const sortCase = (tsn: string, label: string) => ({
  tsn,
  priority: "Medium" as const,
  category: "Positive" as const,
  topic: "Sorting",
  description: `Sort by ${label}`,
  dataTest: `Sort option '${label}'`,
  expected: `Product list is ordered by ${label}`,
});

export const INVENTORY_SUITE: SuiteSpec = {
  specPath: "e2e/ui/inventory.spec.ts",
  filePrefix: "TestResult_Inventory",
  ticket: "Regression - Product list",
  topic: "SauceDemo (/inventory.html) - catalog integrity and all sort options",
  module: "SauceDemo",
  subject: "Product list",
  role: "StandardUser",
  preconditions: "1. Logged in as ROLES.StandardUser (saved session)\n2. Test data: e2e/test-data/inventory.json",
  cases: [
    { tsn: "IN01", priority: "High", category: "Positive", topic: "Catalog", description: "Catalog shows all products with name and price", dataTest: "productCount = 6", expected: "1. 6 products are listed\n2. Names are unique\n3. Every price is above 0" },
    sortCase("IN02", "Name (A to Z)"),
    sortCase("IN03", "Name (Z to A)"),
    sortCase("IN04", "Price (low to high)"),
    sortCase("IN05", "Price (high to low)"),
  ],
};
