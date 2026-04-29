import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

interface ApplicationsRealtimeOptions {
  requestId?: string | null;
  onChange: () => void;
}

export function useApplicationsRealtime({ requestId, onChange }: ApplicationsRealtimeOptions) {
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`applications-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, onChange]);
}
