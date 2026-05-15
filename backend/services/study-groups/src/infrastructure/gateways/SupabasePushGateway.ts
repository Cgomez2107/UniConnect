import type { IPushGateway } from "../../../../../shared/patterns/strategy/PushMovilStrategy.js";

interface Logger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
}

const X_SOURCE_HEADER = "X-Source";
const X_SOURCE_VALUE = "strategy-gateway";

export class SupabasePushGateway implements IPushGateway {
  private readonly edgeFunctionUrl: string;
  private readonly serviceRoleKey: string;
  private readonly logger: Logger;

  constructor(
    edgeFunctionUrl: string,
    serviceRoleKey: string,
    logger?: Logger,
  ) {
    this.edgeFunctionUrl = edgeFunctionUrl.replace(/\/+$/, "");
    this.serviceRoleKey = serviceRoleKey;
    this.logger = logger ?? console;
  }

  async enviarPush(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const response = await fetch(this.edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.serviceRoleKey}`,
        [X_SOURCE_HEADER]: X_SOURCE_VALUE,
      },
      body: JSON.stringify({
        type: "INSERT",
        table: "strategy_gateway",
        record: {
          user_id: userId,
          title,
          body,
          data,
          event_id: data.event_id ?? null,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      throw new Error(
        `Edge Function responded with ${response.status}: ${errorBody}`,
      );
    }

    this.logger.info(
      JSON.stringify({
        gateway: "SupabasePushGateway",
        event: "push_sent",
        userId,
        title,
      }),
    );
  }
}
