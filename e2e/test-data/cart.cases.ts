/**
 * cart.cases.ts — test case details of e2e/ui/cart.spec.ts for the Excel test result.
 */
import type { SuiteSpec } from "./test-case.types";

export const CART_SUITE: SuiteSpec = {
  specPath: "e2e/ui/cart.spec.ts",
  filePrefix: "TestResult_Cart",
  ticket: "Regression - Cart",
  topic: "SauceDemo (/cart.html) - add, remove and keep items in the cart",
  module: "SauceDemo",
  subject: "Cart",
  role: "StandardUser",
  preconditions: "1. Logged in as ROLES.StandardUser (saved session, empty cart)\n2. Test data: e2e/test-data/cart.json",
  cases: [
    { tsn: "CT01", priority: "Critical", category: "Positive", topic: "Cart", description: "Add one product to cart", dataTest: "Sauce Labs Backpack", expected: "1. Cart badge shows 1\n2. Cart lists only Sauce Labs Backpack" },
    { tsn: "CT02", priority: "High", category: "Positive", topic: "Cart", description: "Remove a product from cart", dataTest: "Backpack, Bike Light, Bolt T-Shirt → remove Bike Light", expected: "1. Badge goes from 3 to 2\n2. Cart lists Backpack and Bolt T-Shirt" },
    { tsn: "CT03", priority: "Medium", category: "Positive", topic: "Cart", description: "Cart persists after reload", dataTest: "Backpack, Bike Light", expected: "After reload the badge is 2 and the cart lists both products" },
  ],
};
