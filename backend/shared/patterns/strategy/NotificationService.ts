import type { INotificationStrategy, NotificacionDTO } from "./INotificationStrategy.js";
import type { IPreferenceService } from "./IPreferenceService.js";
import { sanitizeError } from "../../libs/errors/sanitizeError.js";

export interface NotificationResult {
  readonly canal: string;
  readonly status: "success" | "failed";
  readonly error?: string;
}

export interface ResumenNotificacion {
  readonly total: number;
  readonly exitosos: number;
  readonly fallidos: number;
  readonly resultados: NotificationResult[];
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
          await s.enviar(notificacion);
          return { canal: s.canal, status: "success" as const };
        } catch (err) {
          const errorMsg = sanitizeError(err);
          console.error(`[Strategy Error] Canal "${s.canal}" fallido: ${errorMsg}`);
          return { canal: s.canal, status: "failed" as const, error: errorMsg };
        }
      }),
    );

    return this.compilarResumen(resultados);
  }

  private compilarResumen(resultados: PromiseSettledResult<NotificationResult>[]): ResumenNotificacion {
    const envios: NotificationResult[] = resultados.map(r =>
      r.status === "fulfilled"
        ? r.value
        : { canal: "unknown", status: "failed", error: sanitizeError(r.reason) },
    );

    return {
      total: envios.length,
      exitosos: envios.filter(e => e.status === "success").length,
      fallidos: envios.filter(e => e.status === "failed").length,
      resultados: envios,
    };
  }

  getStrategies(): readonly INotificationStrategy[] {
    return this.strategies;
  }
}
