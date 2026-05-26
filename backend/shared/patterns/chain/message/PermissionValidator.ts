import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export interface IGroupPermissionRepository {
  isMemberOrAdmin(requestId: string, userId: string): Promise<boolean>;
}

export class PermissionValidator extends MessageValidator {
  constructor(private readonly permissionRepo: IGroupPermissionRepository) {
    super();
  }

  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    if (metadata?.isGroup && metadata.senderId && metadata.requestId) {
      const hasPermission = await this.permissionRepo.isMemberOrAdmin(
        metadata.requestId,
        metadata.senderId,
      );

      if (!hasPermission) {
        return {
          valido: false,
          codigoError: "PermissionError",
          mensajeError: "No tienes permisos para enviar mensajes en este grupo.",
        };
      }
    }

    return { valido: true };
  }
}