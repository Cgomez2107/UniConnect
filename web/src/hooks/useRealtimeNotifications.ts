import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { mapNotificationDtoToDomain } from "@uniconnect/shared-api";
import { fetchNotifications } from "@/lib/services/notifications.service";

export function useRealtimeNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        "broadcast",
        { event: "*" },
        (payload: any) => {
          const notif = payload.payload || payload;
          const store = useNotificationStore.getState();
          store.addNotification(mapNotificationDtoToDomain(notif));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          fetchNotifications();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
