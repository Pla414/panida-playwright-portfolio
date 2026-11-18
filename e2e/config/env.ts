/**
 * env.ts — the only file that loads e2e/.env and reads process.env.
 * Other files import values from here; playwright.config.ts imports it first.
 * override: false → values passed on the command line win over .env.
 */
import * as dotenv from "dotenv";
import { ENV_FILE } from "./paths";

/** True inside a Playwright worker process (not the main runner). */
export const IS_PLAYWRIGHT_WORKER = !!process.env.TEST_WORKER_INDEX;

dotenv.config({ path: ENV_FILE, override: false, quiet: true });

/** Read an optional env var (empty string = undefined). */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Read a URL env var, fall back to the default, and strip trailing slashes. */
function urlEnv(name: string, defaultValue: string): string {
  const value = optionalEnv(name) ?? defaultValue;
  try {
    new URL(value);
  } catch {
    throw new Error(`[env] ${name}="${value}" is not a valid URL`);
  }
  return value.replace(/\/+$/, "");
}

export const CI = !!process.env.CI;

/** UI app under test — specs use page.goto("/path") relative to this. */
export const BASE_URL = urlEnv("BASE_URL", "https://www.saucedemo.com");

/** REST API under test — API specs call request.get("/path") relative to this. */
export const API_BASE_URL = urlEnv("API_BASE_URL", "https://jsonplaceholder.typicode.com");

/** Default role for the whole suite (validated in roles.ts → getActiveRole). */
export const ACTIVE_ROLE = optionalEnv("ACTIVE_ROLE");
