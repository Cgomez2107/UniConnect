import type { INotification } from "./INotification.js";
import { NotificationDecorator } from "./NotificationDecorator.js";

export type NivelPrioridad = "normal" | "urgente" | "critica";

export class PriorityDecorator extends NotificationDecorator {
  private readonly nivel: NivelPrioridad;

  constructor(notification: INotification, nivel: NivelPrioridad) {
    super(notification);
    if (!["normal", "urgente", "critica"].includes(nivel)) {
      throw new Error(`Nivel inválido: "${nivel}". Debe ser "normal", "urgente" o "critica".`);
    }
    this.nivel = nivel;
  }

  getNivel(): NivelPrioridad {
    return this.nivel;
  }

  override getMetadata(): Record<string, unknown> {
    return { ...this.notification.getMetadata(), nivel: this.nivel };
  }

  override render(): string {
    const etiqueta = this.nivel === "critica" ? "🔴 CRÍTICA" : this.nivel === "urgente" ? "🟠 URGENTE" : "🔵 NORMAL";
    return `[${etiqueta}] ${this.notification.render()}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
