/**
 * playwright.config.ts — runner config.
 * Loads env first, then runs the "setup" project (login per role) before the tests.
 */
import { BASE_URL, CI, IS_PLAYWRIGHT_WORKER } from "./e2e/config/env";
import { defineConfig, devices } from "@playwright/test";
import { getActiveRole, storageStateFor } from "./e2e/auth/roles";

// Validate ACTIVE_ROLE (throws with the list of valid roles)
const ACTIVE_ROLE = getActiveRole();

if (!IS_PLAYWRIGHT_WORKER) {
  console.log("BASE_URL:", BASE_URL);
  console.log("ACTIVE_ROLE:", ACTIVE_ROLE);
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["junit", { outputFile: "test-results/results.xml" }],
    ["json", { outputFile: "test-results/results.json" }],
    // One Excel test result per spec → reports/TestResult_<Name>_<YYYYMMDD>.xlsx
    ["./e2e/reporters/excel-test-result.ts"],
  ],

  use: {
    baseURL: BASE_URL,
    headless: CI ? true : undefined,
    trace: CI ? "retain-on-failure" : "on",
    screenshot: "on",
    video: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  projects: [
    // 1) Log in once per role and save the session (e2e/auth/auth.setup.ts)
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // 2) Real tests — default session is ACTIVE_ROLE; specs can override with test.use(asRole(...))
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStateFor(ACTIVE_ROLE),
      },
      dependencies: ["setup"],
    },
  ],
});
