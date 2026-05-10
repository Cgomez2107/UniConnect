import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";

export interface IPushGateway {
  enviarPush(token: string, title: string, body: string, data: Record<string, unknown>): Promise<void>;
}

export class PushMovilStrategy implements INotificationStrategy {
  readonly canal = "push_movil";

  constructor(private readonly pushGateway: IPushGateway) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      await this.pushGateway.enviarPush(
        notificacion.userId,
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
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
