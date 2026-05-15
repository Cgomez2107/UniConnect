import type { INotification } from "./INotification.js";

export abstract class NotificationDecorator implements INotification {
  protected readonly notification: INotification;

  constructor(notification: INotification) {
    this.notification = notification;
  }

  get mensaje(): string { return this.notification.mensaje; }
  get destinatario(): string { return this.notification.destinatario; }
  get timestamp(): string { return this.notification.timestamp; }

  getMensaje(): string { return this.notification.getMensaje(); }
  getDestinatario(): string { return this.notification.getDestinatario(); }
  getTimestamp(): string { return this.notification.getTimestamp(); }
  getMetadata(): Record<string, unknown> { return this.notification.getMetadata(); }
  render(): string { return this.notification.render(); }
  toJSON(): Record<string, unknown> { return this.notification.toJSON(); }
}
