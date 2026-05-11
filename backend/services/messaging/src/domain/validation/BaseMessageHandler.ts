import type { IMessageValidatorHandler, ValidationResult, ValidatableMessage } from "./IMessageValidatorHandler.js";

export abstract class BaseMessageHandler implements IMessageValidatorHandler {
  private next: IMessageValidatorHandler | null = null;

  setNext(handler: IMessageValidatorHandler): IMessageValidatorHandler {
    this.next = handler;
    return handler;
  }

  async handle(message: ValidatableMessage): Promise<ValidationResult> {
    const result = await this.doValidate(message);

    if (!result.isValid) {
      return result;
    }

    if (this.next) {
      return this.next.handle(message);
    }

    return { isValid: true };
  }

  protected abstract doValidate(message: ValidatableMessage): Promise<ValidationResult>;

  protected abstract getErrorCode(): string;
}
