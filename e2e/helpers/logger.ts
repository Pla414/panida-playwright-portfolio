/**
 * logger.ts — timestamped console logging for tests.
 */

/** Log an info message. */
export function logInfo(message: string): void {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

/** Log an error message. */
export function logError(message: string): void {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
}
