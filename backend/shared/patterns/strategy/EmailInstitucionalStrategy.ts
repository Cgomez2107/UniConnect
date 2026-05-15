import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import type { IUserRepository } from "./IUserRepository.js";
import { sanitizeError } from "../../libs/errors/sanitizeError.js";

export interface IEmailGateway {
  enviarEmail(to: string, subject: string, body: string): Promise<void>;
}

export class EmailInstitucionalStrategy implements INotificationStrategy {
  readonly canal = "email_institucional";

  constructor(
    private readonly emailGateway: IEmailGateway,
    private readonly userRepository: IUserRepository,
  ) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      const contact = await this.userRepository.getContactInfo(notificacion.userId);
      if (!contact.email) {
        return {
          canal: this.canal,
          exitoso: false,
          error: "Usuario no tiene correo electrónico registrado.",
          timestamp: new Date().toISOString(),
        };
      }

      const asunto = `[UniConnect] ${notificacion.title}`;
      const cuerpo = `${notificacion.body}\n\n---\nUniConnect - Universidad`;
      await this.emailGateway.enviarEmail(contact.email, asunto, cuerpo);
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
