import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export interface IModerationRepository {
  isUserBlocked(userId: string): Promise<boolean>;
  blockUser(userId: string, durationMinutes: number, reason: string): Promise<void>;
  recordMessageTimestamp(userId: string): Promise<number>;
}

export class SpamHandler extends MessageValidator {
  constructor(private readonly repo: IModerationRepository) {
    super();
  }

  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    const senderId = metadata?.senderId;
    if (!senderId) {
      return { valido: true };
    }

    // 1. Comprobar si el usuario ya está bloqueado
    const isBlocked = await this.repo.isUserBlocked(senderId);
    if (isBlocked) {
      return {
        valido: false,
        codigoError: "MO_003",
        mensajeError: "Usuario bloqueado temporalmente por spam.",
      };
    }

    // 2. Registrar el intento de mensaje y obtener el conteo en los últimos 30 segundos
    const count = await this.repo.recordMessageTimestamp(senderId);

    // 3. Criterio de rechazo y bloqueo automático
    if (count > 5) {
      await this.repo.blockUser(senderId, 5, "Spam detectado: Envío masivo en 30s");
      return {
        valido: false,
        codigoError: "MO_003",
        mensajeError: "Spam detectado. Usuario bloqueado automáticamente por 5 minutos.",
      };
    }

    return { valido: true };
  }
}
