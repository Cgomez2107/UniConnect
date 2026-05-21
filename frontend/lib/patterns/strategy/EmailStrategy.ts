import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy";

export interface IEmailGateway {
  enviarCorreo(to: string, subject: string, body: string): Promise<void>;
}

export interface IUserEmailRepository {
  getEmail(userId: string): Promise<string | null>;
}

export class EmailStrategy implements INotificationStrategy {
  readonly canal = "email_institucional";

  constructor(
    private readonly emailGateway: IEmailGateway,
    private readonly userRepository: IUserEmailRepository,
  ) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      const email = await this.userRepository.getEmail(notificacion.userId);
      if (!email) {
        return {
          canal: this.canal,
          exitoso: false,
          error: "Usuario no tiene email registrado.",
          timestamp: new Date().toISOString(),
        };
      }

      await this.emailGateway.enviarCorreo(
        email,
        notificacion.title,
        `${notificacion.body}\n\n---\nUniConnect`,
      );

      return {
        canal: this.canal,
        exitoso: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        canal: this.canal,
        exitoso: false,
        error: error instanceof Error ? error.message : "Error de email",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
