export function requireTrimmed(value: string, fieldLabel: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${fieldLabel} es obligatorio.`);
  }

  return normalized;
}