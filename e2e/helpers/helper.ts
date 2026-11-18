/**
 * helper.ts — small generic utilities not tied to any page.
 */

/** Return a unique text like "test-1700000000000". */
export function generateRandomText(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}`;
}

/** Return the current date-time in ISO format. */
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}

/** Parse a money label like "Item total: $39.98" into 39.98. */
export function parseMoney(text: string): number {
  const match = /-?\d+(?:\.\d+)?/.exec(text.replace(/,/g, ""));
  if (!match) throw new Error(`[helper] No amount found in "${text}"`);
  return Number(match[0]);
}
