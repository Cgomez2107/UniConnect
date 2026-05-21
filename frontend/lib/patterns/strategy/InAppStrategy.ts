import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy";
import { useNotificationStore } from "@/store/useNotificationStore";

export class InAppStrategy implements INotificationStrategy {
  readonly canal = "in_app";

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      const store = useNotificationStore.getState();
      store.pushNotification({
        id: crypto.randomUUID(),
        type: notificacion.type as any,
        title: notificacion.title,
        body: notificacion.body,
        payload: notificacion.payload,
        priority: notificacion.priority,
        action: notificacion.action,
      });

      return {
        canal: this.canal,
        exitoso: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        canal: this.canal,
        exitoso: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
