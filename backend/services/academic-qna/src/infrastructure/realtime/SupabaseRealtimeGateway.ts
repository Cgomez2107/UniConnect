import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CHANNEL_PREFIX = "forum-notifications:";

export class SupabaseRealtimeGateway {
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
  }

  dispose(): void {
    for (const [name, channel] of this.channels) {
      this.supabase.removeChannel(channel);
    }
    this.channels.clear();
  }
}
