/**
 * attachments.ts — attachment names shared by the test helpers and the Excel reporter.
 * Kept in its own file with no imports, so the reporter does not load the test runner.
 */

/** Screenshot taken after each step by the `step` fixture (helpers/test.ts). */
export const STEP_SCREENSHOT = "step-screenshot";

/** Request / response of one API call, logged by helpers/api-log.ts. */
export const API_CALL = "api-call";

/** Shape of the API_CALL attachment (JSON). */
export interface ApiCallLog {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status: number;
  statusText: string;
  durationMs: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
}
