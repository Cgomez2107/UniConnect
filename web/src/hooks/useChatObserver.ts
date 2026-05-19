import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { snakeToCamel } from "@uniconnect/shared-api";

export function useChatObserver(
  groupId: string | null,
  onNewMessage: (message: any) => void
) {
  const cbRef = useRef(onNewMessage);
  cbRef.current = onNewMessage;

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.id) return;
          cbRef.current(snakeToCamel(newMsg));
        }
      )
      .on(
        "broadcast",
        { event: "new_group_message" },
        (payload: any) => {
          if (!payload || !payload.id) return;
          cbRef.current(snakeToCamel(payload));
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`[useChatObserver] Subscribed to group ${groupId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[useChatObserver] Subscription error for group ${groupId}:`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);
}
