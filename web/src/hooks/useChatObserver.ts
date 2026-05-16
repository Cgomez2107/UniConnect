import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

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
          cbRef.current(newMsg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);
}
