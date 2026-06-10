import { createClient, type SupabaseClient, REALTIME_CHANNEL_STATES } from "@supabase/supabase-js";
import type { IEventSocketGateway } from "../../domain/events/UniversityEventObserver.js";

const CHANNEL_PREFIX = "event-notifications:";

function isChannelUsable(channel: ReturnType<SupabaseClient["channel"]>): boolean {
  const state = (channel as any).state;
  return state === REALTIME_CHANNEL_STATES.joined
    || state === REALTIME_CHANNEL_STATES.joining;
}

export class SupabaseRealtimeEventGateway implements IEventSocketGateway {
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
              gateway: "SupabaseRealtimeEventGateway",
              event: "channel_subscribe_status",
              channel: channelName,
              status,
            }),
          );
        }
      });
      this.channels.set(channelName, channel);
    }

    if (!isChannelUsable(channel)) {
      console.warn(
        JSON.stringify({
          gateway: "SupabaseRealtimeEventGateway",
          event: "channel_not_usable",
          channel: channelName,
          state: (channel as any).state,
          message: "Skipping broadcast — channel not in a usable state",
        }),
      );
      return;
    }

    await channel.send({
      type: "broadcast",
      event,
      payload,
    });

    console.log(
      JSON.stringify({
        gateway: "SupabaseRealtimeEventGateway",
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
      console.log(
        JSON.stringify({
          gateway: "SupabaseRealtimeEventGateway",
          event: "channel_removed",
          channel: name,
        }),
      );
    }
    this.channels.clear();
  }
}
