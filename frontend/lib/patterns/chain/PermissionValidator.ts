import { BaseValidator } from "./BaseValidator";
import type { ValidationMetadata } from "./IValidationHandler";

export interface IGroupPermissionRepository {
  canSendMessage(userId: string, requestId: string): Promise<boolean>;
}

export class PermissionValidator extends BaseValidator {
  constructor(private readonly permissionRepo?: IGroupPermissionRepository) {
    super();
  }

  async validate(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (!metadata?.senderId || !metadata?.requestId) return;
    if (!this.permissionRepo) return;

    const permitted = await this.permissionRepo.canSendMessage(
      metadata.senderId,
      metadata.requestId,
    );

    if (!permitted) {
      const error = new Error("No tienes permisos para enviar mensajes en este grupo.");
      error.name = "PERMISSION_DENIED";
      throw error;
    }
  }
}
