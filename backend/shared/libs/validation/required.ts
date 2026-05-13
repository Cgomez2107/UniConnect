import { DtoValidationError } from "./ValidationError.js";

export function requireTrimmed(value: string, fieldLabel: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new DtoValidationError("Validation failed", { [fieldLabel]: `${fieldLabel} es obligatorio.` });
  }

  return normalized;
}