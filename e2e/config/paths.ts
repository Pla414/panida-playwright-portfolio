/**
 * paths.ts — single source of project paths.
 * All paths are built from the project root with path.join, so they work on macOS and Windows.
 */
import fs from "fs";
import path from "path";

/** Project root (the folder that holds package.json). */
export const ROOT = path.resolve(__dirname, "..", "..");

export const E2E_DIR = path.join(ROOT, "e2e");
export const ENV_FILE = path.join(E2E_DIR, ".env");

/** Saved login sessions (storageState) — gitignored. */
export const AUTH_DIR = path.join(ROOT, ".auth");

/** Files written by tests (screenshots, exports) — gitignored. */
export const REPORTS_DIR = path.join(ROOT, "reports");

export const TEST_DATA_DIR = path.join(E2E_DIR, "test-data");

/** Create the folder if missing and return the same path. */
export function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
