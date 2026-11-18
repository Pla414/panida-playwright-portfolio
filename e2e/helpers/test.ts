/**
 * test.ts — Playwright `test` with a `step` fixture that screenshots the page after every step.
 * UI specs import { test, expect } from here and write:
 *   await step("Add product", async () => { ... });
 * The screenshot is attached to the step itself (also when the step fails), and
 * the Excel reporter puts it under that step in the test case's sheet.
 * API specs keep plain test.step from @playwright/test (no page, no screenshot).
 */
import { test as base, expect } from "@playwright/test";
import { STEP_SCREENSHOT } from "./attachments";

/** Run a titled test step, then attach a screenshot of the page to it. */
export type StepFn = <T>(title: string, body: () => Promise<T>) => Promise<T>;

export const test = base.extend<{ step: StepFn }>({
  step: async ({ page }, use, testInfo) => {
    const step: StepFn = (title, body) =>
      base.step(title, async () => {
        try {
          return await body();
        } finally {
          // Capture the page even if the step failed; ignore errors if the page is already closed
          const shot = await page.screenshot().catch(() => undefined);
          if (shot) await testInfo.attach(STEP_SCREENSHOT, { body: shot, contentType: "image/png" });
        }
      });
    await use(step);
  },
});

export { expect };
