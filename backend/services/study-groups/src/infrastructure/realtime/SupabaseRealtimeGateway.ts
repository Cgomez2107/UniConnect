import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IStudyGroupSocketGateway } from "../../../../../shared/patterns/strategy/InAppWebSocketStrategy.js";

interface Logger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
}

const CHANNEL_PREFIX = "user-notifications:";

export class SupabaseRealtimeGateway implements IStudyGroupSocketGateway {
  private readonly supabase: SupabaseClient;
  private readonly logger: Logger;
  private readonly channels: Map<string, ReturnType<SupabaseClient["channel"]>> = new Map();

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string,
    logger?: Logger,
  ) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.logger = logger ?? console;
  }

  async emitToGroup(groupId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const channelName = `chat-${groupId}`;

    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });
      const subResult: { status: string } = await new Promise((resolve) => {
        channel!.subscribe((status: string) => resolve({ status }));
      });
      if (subResult.status !== "SUBSCRIBED") {
        this.logger.warn(
          JSON.stringify({
            gateway: "SupabaseRealtimeGateway",
            event: "channel_subscribe_status",
            channel: channelName,
            status: subResult.status,
            groupId,
          }),
        );
      }
      this.channels.set(channelName, channel);
    }

    const result = await channel.send({
      type: "broadcast",
      event,
      payload,
    });

    this.logger.info(
      JSON.stringify({
        gateway: "SupabaseRealtimeGateway",
        event: "group_broadcast_sent",
        groupId,
        channel: channelName,
        broadcastEvent: event,
        sendResult: result,
      }),
    );
  }

  async emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const channelName = `${CHANNEL_PREFIX}${userId}`;

    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });
      const subResult: { status: string } = await new Promise((resolve) => {
        channel!.subscribe((status: string) => resolve({ status }));
      });
      if (subResult.status !== "SUBSCRIBED") {
        this.logger.warn(
          JSON.stringify({
            gateway: "SupabaseRealtimeGateway",
            event: "channel_subscribe_status",
            channel: channelName,
            status: subResult.status,
            userId,
          }),
        );
      }
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: "broadcast",
      event,
      payload,
    });

    this.logger.info(
      JSON.stringify({
        gateway: "SupabaseRealtimeGateway",
        event: "broadcast_sent",
        userId,
        channel: channelName,
        broadcastEvent: event,
      }),
    );
  }

  dispose(): void {
    for (const [name, channel] of this.channels) {
      this.supabase.removeChannel(channel);
      this.logger.info(
        JSON.stringify({
          gateway: "SupabaseRealtimeGateway",
          event: "channel_removed",
          channel: name,
        }),
      );
    }
    this.channels.clear();
  }
}
