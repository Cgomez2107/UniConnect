import { BaseMessageHandler } from "./BaseMessageHandler.js";
import type { ValidationResult, ValidatableMessage } from "./IMessageValidatorHandler.js";
import type { IBannedWordList } from "./services/IBannedWordList.js";

export class ContentValidator extends BaseMessageHandler {
  constructor(private readonly bannedWordList: IBannedWordList) {
    super();
  }

  protected getErrorCode(): string {
    return "INVALID_CONTENT";
  }

  protected async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
    const hasBanned = await this.bannedWordList.containsBannedWord(message.content);
    if (hasBanned) {
      return { isValid: false, errorCode: this.getErrorCode() };
    }
    return { isValid: true };
  }
}
