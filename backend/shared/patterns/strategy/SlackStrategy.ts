import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";

export interface ISlackGateway {
  enviarMensaje(canal: string, texto: string): Promise<void>;
}

export class SlackStrategy implements INotificationStrategy {
  readonly canal = "slack";

  constructor(private readonly slackGateway: ISlackGateway) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    const texto = `*${notificacion.title}*\n${notificacion.body}`;
    await this.slackGateway.enviarMensaje(notificacion.userId, texto);
    return { canal: this.canal, exitoso: true, timestamp: new Date().toISOString() };
  }
}
