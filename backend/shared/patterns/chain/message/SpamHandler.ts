import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export interface IModerationRepository {
  isUserBlocked(userId: string): Promise<boolean>;
  blockUser(userId: string, durationMinutes: number, reason: string): Promise<void>;
  recordMessageTimestamp(userId: string): Promise<number>;
  getUserBlockExpiration?(userId: string): Promise<Date | null>;
  recordBlockEvent(userId: string, reason: string): Promise<void>;
  countBlocksInLastHour(userId: string): Promise<number>;
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
    let isBlocked = false;
    let blockUntil: Date | null = null;

    if (typeof this.repo.getUserBlockExpiration === "function") {
      blockUntil = await this.repo.getUserBlockExpiration(senderId);
      isBlocked = !!blockUntil;
    } else {
      isBlocked = await this.repo.isUserBlocked(senderId);
    }

    if (isBlocked) {
      const remainingMs = blockUntil ? blockUntil.getTime() - Date.now() : 5 * 60 * 1000;
      const blockCount = await this.repo.countBlocksInLastHour(senderId);
      if (blockCount >= 3) {
        return {
          valido: false,
          codigoError: "MO_004",
          mensajeError: `Has acumulado múltiples infracciones. Tu caso ha sido escalado a revisión humana. Restante: ${Math.max(0, remainingMs)}`,
        };
      }
      return {
        valido: false,
        codigoError: "MO_003",
        mensajeError: `Usuario bloqueado temporalmente por spam. Restante: ${Math.max(0, remainingMs)}`,
      };
    }

    // 2. Registrar el intento de mensaje y obtener el conteo en los últimos 30 segundos
    const count = await this.repo.recordMessageTimestamp(senderId);

    // 3. Criterio de rechazo y bloqueo automático
    if (count > 5) {
      await this.repo.blockUser(senderId, 5, "Spam detectado: Envío masivo en 30s");
      await this.repo.recordBlockEvent(senderId, "Spam detectado: Envío masivo en 30s");
      const blockCount = await this.repo.countBlocksInLastHour(senderId);
      if (blockCount >= 3) {
        return {
          valido: false,
          codigoError: "MO_004",
          mensajeError: `Spam detectado. Has acumulado múltiples infracciones. Tu caso ha sido escalado a revisión humana. Restante: ${5 * 60 * 1000}`,
        };
      }
      return {
        valido: false,
        codigoError: "MO_003",
        mensajeError: `Spam detectado. Usuario bloqueado automáticamente por 5 minutos. Restante: ${5 * 60 * 1000}`,
      };
    }

    return { valido: true };
  }
}

