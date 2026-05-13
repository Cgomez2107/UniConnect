import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import type { IUserRepository } from "./IUserRepository.js";
import { sanitizeError } from "../../libs/errors/sanitizeError.js";

export interface IPushGateway {
  enviarPush(token: string, title: string, body: string, data: Record<string, unknown>): Promise<void>;
}

export class PushMovilStrategy implements INotificationStrategy {
  readonly canal = "push_movil";

  constructor(
    private readonly pushGateway: IPushGateway,
    private readonly userRepository: IUserRepository,
  ) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      const contact = await this.userRepository.getContactInfo(notificacion.userId);
      if (!contact.pushToken) {
        return {
          canal: this.canal,
          exitoso: false,
          error: "Usuario no tiene token de notificación registrado.",
          timestamp: new Date().toISOString(),
        };
      }

      await this.pushGateway.enviarPush(
        contact.pushToken,
        notificacion.title,
        notificacion.body,
        {
          type: notificacion.type,
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
