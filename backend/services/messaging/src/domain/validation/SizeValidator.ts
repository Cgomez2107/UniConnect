import { BaseMessageHandler } from "./BaseMessageHandler.js";
import type { ValidationResult, ValidatableMessage } from "./IMessageValidatorHandler.js";

export class SizeValidator extends BaseMessageHandler {
  private static readonly MAX_LENGTH = 500;

  protected getErrorCode(): string {
    return "SIZE_EXCEEDED";
  }

  protected async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
    if (message.content.length > SizeValidator.MAX_LENGTH) {
      return { isValid: false, errorCode: this.getErrorCode() };
    }
    return { isValid: true };
  }
}
