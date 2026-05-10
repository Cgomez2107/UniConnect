import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";

export interface IEmailGateway {
  enviarEmail(to: string, subject: string, body: string): Promise<void>;
}

export class EmailInstitucionalStrategy implements INotificationStrategy {
  readonly canal = "email_institucional";

  constructor(private readonly emailGateway: IEmailGateway) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      const asunto = `[UniConnect] ${notificacion.title}`;
      const cuerpo = `${notificacion.body}\n\n---\nUniConnect - Universidad`;
      await this.emailGateway.enviarEmail(notificacion.userId, asunto, cuerpo);
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
