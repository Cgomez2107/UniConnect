export interface NotificacionDTO {
  readonly userId: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly payload: Record<string, unknown> | null;
  readonly priority?: "normal" | "urgente" | "critica";
  readonly action?: { label: string; endpoint: string };
  readonly category?: string;
}

export interface ResultadoEnvio {
  readonly canal: string;
  readonly exitoso: boolean;
  readonly error?: string;
  readonly timestamp: string;
}

export interface INotificationStrategy {
  readonly canal: string;
  enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio>;
}
