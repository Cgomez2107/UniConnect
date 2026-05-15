export interface INotification {
  readonly mensaje: string;
  readonly destinatario: string;
  readonly timestamp: string;

  getMensaje(): string;
  getDestinatario(): string;
  getTimestamp(): string;
  getMetadata(): Record<string, unknown>;
  render(): string;
  toJSON(): Record<string, unknown>;
}
