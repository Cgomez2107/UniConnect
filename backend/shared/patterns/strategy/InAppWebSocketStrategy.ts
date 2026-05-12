import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import { sanitizeError } from "../../libs/errors/sanitizeError.js";

export interface IStudyGroupSocketGateway {
  emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void>;
}

export class InAppWebSocketStrategy implements INotificationStrategy {
  readonly canal = "in_app_websocket";

  constructor(private readonly gateway: IStudyGroupSocketGateway) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      await this.gateway.emitToUser(
        notificacion.userId,
        notificacion.type,
        {
          title: notificacion.title,
          body: notificacion.body,
          ...(notificacion.payload ?? {}),
        },
      );
      return { canal: this.canal, exitoso: true, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        canal: this.canal,
        exitoso: false,
        error: sanitizeError(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
