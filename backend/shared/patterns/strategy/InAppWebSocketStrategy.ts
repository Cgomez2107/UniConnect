import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import { sanitizeError } from "../../libs/errors/sanitizeError.js";

export interface IStudyGroupSocketGateway {
  emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void>;
}

export interface INotificationPersistenceRepository {
  create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
  }): Promise<string>;
}

export class InAppWebSocketStrategy implements INotificationStrategy {
  readonly canal = "in_app_websocket";

  constructor(
    private readonly gateway: IStudyGroupSocketGateway,
    private readonly notificationRepository?: INotificationPersistenceRepository,
  ) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      let notificationId: string | undefined;
      if (this.notificationRepository) {
        notificationId = await this.notificationRepository.create({
          userId: notificacion.userId,
          type: notificacion.type,
          title: notificacion.title,
          body: notificacion.body,
          payload: notificacion.payload,
        });
      }

      await this.gateway.emitToUser(
        notificacion.userId,
        notificacion.type,
        {
          id: notificationId,
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
