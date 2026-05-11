import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import type { IPreferenceService } from "./IPreferenceService.js";

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
      .getCanalesActivos(notificacion.userId, notificacion.type);

    const estrategiasActivas = this.strategies.filter(
      s => canalesActivos.includes(s.canal),
    );

    const resultados = await Promise.allSettled(
      estrategiasActivas.map(s => s.enviar(notificacion)),
    );

    return this.compilarResumen(resultados);
  }

  private compilarResumen(resultados: PromiseSettledResult<ResultadoEnvio>[]): ResumenNotificacion {
    const envios: ResultadoEnvio[] = resultados.map(r =>
      r.status === "fulfilled"
        ? r.value
        : { canal: "unknown", exitoso: false, error: (r.reason as Error)?.message ?? "Unknown error", timestamp: new Date().toISOString() },
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
