import { BaseMessageHandler } from "./BaseMessageHandler.js";
import type { ValidationResult, ValidatableMessage } from "./IMessageValidatorHandler.js";
import type { IUserExistenceService } from "./services/IUserExistenceService.js";

export class MentionsValidator extends BaseMessageHandler {
  constructor(private readonly userExistenceService: IUserExistenceService) {
    super();
  }

  protected getErrorCode(): string {
    return "USER_NOT_FOUND";
  }

  protected async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
    if (message.mentionedUserIds.length === 0) {
      return { isValid: true };
    }

    const allExist = await this.userExistenceService.allUsersExist(message.mentionedUserIds);
    if (!allExist) {
      return { isValid: false, errorCode: this.getErrorCode() };
    }
    return { isValid: true };
  }
}
