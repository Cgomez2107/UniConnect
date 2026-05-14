import { ValidationError } from "../errors/index.js";

export function requireTrimmed(value: string, fieldLabel: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new ValidationError(`${fieldLabel} es obligatorio.`);
  }

  return normalized;
}