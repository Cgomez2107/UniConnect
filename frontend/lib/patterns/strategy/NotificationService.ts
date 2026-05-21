import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy";
import type { IPreferenceService } from "./IPreferenceService";

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
    const canalesActivos = await this.preferenceService.getCanalesActivos(
      notificacion.userId,
      notificacion.type,
      notificacion.priority,
    );

    const estrategiasActivas = this.strategies.filter(
      (s) => canalesActivos.includes(s.canal),
    );

    const resultados = await Promise.allSettled(
      estrategiasActivas.map(async (s) => {
        try {
          return await s.enviar(notificacion);
        } catch (err) {
          return {
            canal: s.canal,
            exitoso: false,
            error: err instanceof Error ? err.message : "Error desconocido",
            timestamp: new Date().toISOString(),
          } as ResultadoEnvio;
        }
      }),
    );

    return this.compilarResumen(resultados);
  }

  private compilarResumen(resultados: PromiseSettledResult<ResultadoEnvio>[]): ResumenNotificacion {
    const envios: ResultadoEnvio[] = resultados.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : {
            canal: "unknown",
            exitoso: false,
            error: r.reason instanceof Error ? r.reason.message : "Error desconocido",
            timestamp: new Date().toISOString(),
          },
    );

    return {
      total: envios.length,
      exitosos: envios.filter((e) => e.exitoso).length,
      fallidos: envios.filter((e) => !e.exitoso).length,
      resultados: envios,
    };
  }

  getStrategies(): readonly INotificationStrategy[] {
    return this.strategies;
  }
}
