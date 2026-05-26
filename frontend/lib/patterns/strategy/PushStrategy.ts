import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy";

export interface IExpoPushGateway {
  enviarPush(token: string, title: string, body: string, data: Record<string, unknown>): Promise<void>;
}

export interface IUserPushRepository {
  getPushToken(userId: string): Promise<string | null>;
}

export class PushStrategy implements INotificationStrategy {
  readonly canal = "push_movil";

  constructor(
    private readonly pushGateway: IExpoPushGateway,
    private readonly userRepository: IUserPushRepository,
  ) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      const pushToken = await this.userRepository.getPushToken(notificacion.userId);
      if (!pushToken) {
        return {
          canal: this.canal,
          exitoso: false,
          error: "Usuario no tiene token de notificación registrado.",
          timestamp: new Date().toISOString(),
        };
      }

      await this.pushGateway.enviarPush(
        pushToken,
        notificacion.title,
        notificacion.body,
        { type: notificacion.type, ...(notificacion.payload ?? {}) },
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
        error: error instanceof Error ? error.message : "Error de push",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
