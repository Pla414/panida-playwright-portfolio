export function generateRandomText(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}`;
}

export function getCurrentDateTime(): string {
  return new Date().toISOString();
}
