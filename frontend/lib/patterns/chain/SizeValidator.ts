import { BaseValidator } from "./BaseValidator";
import type { ValidationMetadata } from "./IValidationHandler";

export class SizeValidator extends BaseValidator {
  constructor(private readonly maxLength: number = 1000) {
    super();
  }

  async validate(content: string, _metadata?: ValidationMetadata): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (trimmed.length > this.maxLength) {
      const error = new Error(`El mensaje excede el límite de ${this.maxLength} caracteres.`);
      error.name = "MESSAGE_TOO_LONG";
      throw error;
    }
  }
}
