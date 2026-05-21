import type { IValidationHandler, ValidationResult, ValidationMetadata } from "./IValidationHandler";

export abstract class BaseValidator implements IValidationHandler {
  protected next: IValidationHandler | null = null;

  setNext(handler: IValidationHandler): IValidationHandler {
    this.next = handler;
    return handler;
  }

  setSiguiente(handler: IValidationHandler): IValidationHandler {
    return this.setNext(handler);
  }

  abstract validate(content: string, metadata?: ValidationMetadata): Promise<void>;

  async handle(content: string, metadata?: ValidationMetadata): Promise<ValidationResult> {
    try {
      await this.validate(content, metadata);
      if (this.next) {
        return this.next.handle(content, metadata);
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorCode: error instanceof Error ? error.name : "VALIDATION_ERROR",
        errorMessage: error instanceof Error ? error.message : "Error de validación",
      };
    }
  }

  protected async executeNext(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (this.next) {
      await this.next.validate(content, metadata);
    }
  }
}
