import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import type { IPreferenceService } from "./IPreferenceService.js";
import { sanitizeError } from "../../libs/errors/sanitizeError.js";

export interface ResumenNotificacion {
  readonly total: number;
  readonly exitosos: number;
  readonly fallidos: number;
  readonly resultados: ResultadoEnvio[];
}

export class NotificationService {
  constructor(
    private readonly strategies: INotificationStrategy[],
    private readonly preferenceService: IPreferenceService,
  ) {}

  async notificar(notificacion: NotificacionDTO): Promise<ResumenNotificacion> {
    const canalesActivos = await this.preferenceService
      .getCanalesActivos(notificacion.userId, notificacion.type, notificacion.priority);

    const estrategiasActivas = this.strategies.filter(
      s => canalesActivos.includes(s.canal),
    );

    const resultados = await Promise.allSettled(
      estrategiasActivas.map(async s => {
        try {
          return await s.enviar(notificacion);
        } catch (err) {
          return {
            canal: s.canal,
            exitoso: false,
            error: sanitizeError(err),
            timestamp: new Date().toISOString(),
          } as ResultadoEnvio;
        }
      }),
    );

    return this.compilarResumen(resultados);
  }

  private compilarResumen(resultados: PromiseSettledResult<ResultadoEnvio>[]): ResumenNotificacion {
    const envios: ResultadoEnvio[] = resultados.map(r =>
      r.status === "fulfilled"
        ? r.value
        : { canal: "unknown", exitoso: false, error: sanitizeError(r.reason), timestamp: new Date().toISOString() },
    );

    return {
      total: envios.length,
      exitosos: envios.filter(e => e.exitoso).length,
      fallidos: envios.filter(e => !e.exitoso).length,
      resultados: envios,
    };
  }

  getStrategies(): readonly INotificationStrategy[] {
    return this.strategies;
  }
}
