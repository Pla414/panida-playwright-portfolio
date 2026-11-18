/**
 * api-log.ts — send an API request and attach its request / response to the current test step.
 * The log shows under Attachments in the HTML report and in the "API Calls" section of the Excel result.
 */
import { test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { API_CALL, type ApiCallLog } from "./attachments";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Parse a body as JSON when possible, otherwise keep the raw text. */
function parseBody(text: string): unknown {
  if (!text) return "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Send a request with the given context, log it, and return the response. */
export async function sendLogged(
  request: APIRequestContext,
  method: HttpMethod,
  path: string,
  data?: unknown,
): Promise<APIResponse> {
  const started = Date.now();
  const response = await request.fetch(path, { method, data });
  const durationMs = Date.now() - started;

  const log: ApiCallLog = {
    method,
    url: response.url(),
    // Playwright sends JSON bodies with this header
    requestHeaders: data === undefined ? {} : { "content-type": "application/json" },
    requestBody: data,
    status: response.status(),
    statusText: response.statusText(),
    durationMs,
    responseHeaders: response.headers(),
    // The body is buffered, so the spec can still call response.json() afterwards
    responseBody: parseBody(await response.text()),
  };
  await test.info().attach(API_CALL, { body: JSON.stringify(log, null, 2), contentType: "application/json" });
  return response;
}
