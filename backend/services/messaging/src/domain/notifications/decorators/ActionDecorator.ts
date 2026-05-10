import type { INotification } from "./INotification.js";
import { NotificationDecorator } from "./NotificationDecorator.js";

export interface Accion {
  label: string;
  endpoint: string;
}

export class ActionDecorator extends NotificationDecorator {
  private readonly accion: Accion;

  constructor(notification: INotification, accion: Accion) {
    super(notification);
    if (!accion.label || !accion.endpoint) {
      throw new Error("La acción debe tener un label y un endpoint no vacíos.");
    }
    this.accion = accion;
  }

  getAccion(): Accion {
    return this.accion;
  }

  override getMetadata(): Record<string, unknown> {
    return { ...this.notification.getMetadata(), accion: { ...this.accion } };
  }

  override render(): string {
    return `${this.notification.render()}\n[Acción: ${this.accion.label} → ${this.accion.endpoint}]`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
