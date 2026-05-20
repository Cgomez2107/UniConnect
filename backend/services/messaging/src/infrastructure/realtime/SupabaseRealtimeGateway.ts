import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IStudyGroupSocketGateway } from "../../../../../shared/patterns/strategy/InAppWebSocketStrategy.js";
import type { IRealtimeService } from "../../domain/events/index.js";

const CHANNEL_PREFIX = "user-notifications:";

export class SupabaseRealtimeGateway implements IStudyGroupSocketGateway, IRealtimeService {
  private readonly supabase: SupabaseClient;
  private readonly channels: Map<string, ReturnType<SupabaseClient["channel"]>> = new Map();

  constructor(
    supabaseUrl: string,
    supabaseServiceRoleKey: string,
  ) {
    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  async emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const channelName = `${CHANNEL_PREFIX}${userId}`;

    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });
      channel.subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.warn(
            JSON.stringify({
              gateway: "SupabaseRealtimeGateway",
              event: "channel_subscribe_status",
              channel: channelName,
              status,
            }),
          );
        }
      });
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: "broadcast",
      event,
      payload,
    });

    console.log(
      JSON.stringify({
        gateway: "SupabaseRealtimeGateway",
        event: "broadcast_sent",
        userId,
        channel: channelName,
        broadcastEvent: event,
      }),
    );
  }

  async broadcast(channelName: string, message: { type: string; data: Record<string, unknown> }): Promise<void> {
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });
      channel.subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.warn(
            JSON.stringify({
              gateway: "SupabaseRealtimeGateway",
              event: "channel_subscribe_status",
              channel: channelName,
              status,
            }),
          );
        }
      });
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: "broadcast",
      event: message.type,
      payload: message.data,
    });

    console.log(
      JSON.stringify({
        gateway: "SupabaseRealtimeGateway",
        event: "channel_broadcast_sent",
        channel: channelName,
        broadcastEvent: message.type,
      }),
    );
  }

  dispose(): void {
    for (const [name, channel] of this.channels) {
      this.supabase.removeChannel(channel);
      console.log(
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
