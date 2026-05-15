import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import { PermissionError } from "../../../libs/errors/PermissionError.js";

export interface IGroupPermissionRepository {
  isMemberOrAdmin(requestId: string, userId: string): Promise<boolean>;
}

export class PermissionValidator extends MessageValidator {
  constructor(private readonly permissionRepo: IGroupPermissionRepository) {
    super();
  }

  async validate(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (metadata?.isGroup && metadata.senderId && metadata.requestId) {
      const hasPermission = await this.permissionRepo.isMemberOrAdmin(
        metadata.requestId,
        metadata.senderId,
      );

      if (!hasPermission) {
        throw new PermissionError("No tienes permisos para enviar mensajes en este grupo.");
      }
    }

    await this.executeNext(content, metadata);
  }
}
