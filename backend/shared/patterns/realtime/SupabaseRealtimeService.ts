import { createClient, type SupabaseClient, type RealtimeChannel } from "@supabase/supabase-js";

export class SupabaseRealtimeService {
  private readonly supabase: SupabaseClient;
  private readonly channels: Map<string, RealtimeChannel> = new Map();

  constructor(supabaseUrl: string, supabaseServiceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  async broadcast(
    channelName: string,
    message: { type: string; data: Record<string, unknown> },
  ): Promise<void> {
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });
      channel.subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: "broadcast",
      event: message.type,
      payload: message.data,
    });
  }

  dispose(): void {
    for (const [name, channel] of this.channels) {
      this.supabase.removeChannel(channel);
    }
    this.channels.clear();
  }
}
