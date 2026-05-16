import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface GroupEventsCallbacks {
  onNewApplication?: (application: any) => void;
  onApplicationAccepted?: (application: any) => void;
  onApplicationRejected?: (application: any) => void;
  onMemberAdded?: (member: any) => void;
  onMemberRemoved?: (member: any) => void;
}

export function useGroupEventsObserver(
  groupId: string | null,
  callbacks: GroupEventsCallbacks
) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-events-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `request_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            cbRef.current.onNewApplication?.(payload.new);
          } else if (payload.eventType === "UPDATE") {
            const status = payload.new?.status;
            if (status === "aceptada") {
              cbRef.current.onApplicationAccepted?.(payload.new);
            } else if (status === "rechazada") {
              cbRef.current.onApplicationRejected?.(payload.new);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_members",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          cbRef.current.onMemberAdded?.(payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "study_group_members",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          cbRef.current.onMemberRemoved?.(payload.old);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);
}
