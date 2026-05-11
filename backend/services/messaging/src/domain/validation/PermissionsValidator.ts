import { BaseMessageHandler } from "./BaseMessageHandler.js";
import type { ValidationResult, ValidatableMessage } from "./IMessageValidatorHandler.js";
import type { IChatPermissionService } from "./services/IChatPermissionService.js";

export class PermissionsValidator extends BaseMessageHandler {
  constructor(private readonly chatPermissionService: IChatPermissionService) {
    super();
  }

  protected getErrorCode(): string {
    return "NO_WRITE_PERMISSION";
  }

  protected async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
    const isBanned = await this.chatPermissionService.isUserBanned(
      message.senderId,
      message.conversationId,
    );
    if (isBanned) {
      return { isValid: false, errorCode: "USER_BANNED" };
    }

    const canWrite = await this.chatPermissionService.canWrite(
      message.senderId,
      message.conversationId,
    );
    if (!canWrite) {
      return { isValid: false, errorCode: this.getErrorCode() };
    }

    return { isValid: true };
  }
}
