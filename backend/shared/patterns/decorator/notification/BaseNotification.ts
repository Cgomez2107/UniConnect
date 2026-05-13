import type { INotification } from "./INotification.js";

export class BaseNotification implements INotification {
  readonly mensaje: string;
  readonly destinatario: string;
  readonly timestamp: string;

  constructor(input: { mensaje: string; destinatario: string; timestamp: string }) {
    this.mensaje = input.mensaje;
    this.destinatario = input.destinatario;
    this.timestamp = input.timestamp;
  }

  getMensaje(): string { return this.mensaje; }
  getDestinatario(): string { return this.destinatario; }
  getTimestamp(): string { return this.timestamp; }

  getMetadata(): Record<string, unknown> {
    return {
      mensaje: this.mensaje,
      destinatario: this.destinatario,
      timestamp: this.timestamp,
    };
  }

  render(): string {
    return `[${this.timestamp}] Para: ${this.destinatario} — ${this.mensaje}`;
  }

  toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
