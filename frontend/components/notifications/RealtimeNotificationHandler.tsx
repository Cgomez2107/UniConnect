import React, { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { fetchApi } from "@/lib/api/httpClient";
import { useStrategyNotifier } from "@/hooks/application/useStrategyNotifier";

export function RealtimeNotificationHandler() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const { pushNotification, markTransferAccepted } = useNotificationStore();
  const { notificar } = useStrategyNotifier();
  const channelRef = React.useRef<any>(null);

  useEffect(() => {
    if (!userId) {
      console.log("[RealtimeNotificationHandler] No hay userId, saltando suscripción.");
      return;
    }

    // Cargar notificaciones existentes al iniciar
    (async () => {
      try {
        const existing = await fetchApi<any[]>("/notifications");
        if (Array.isArray(existing)) {
          for (const notif of existing) {
            if (!notif.readAt) {
              pushNotification({
                id: notif.id,
                type: (notif.type ?? "").toLowerCase(),
                title: notif.title ?? "",
                body: notif.body ?? "",
                payload: notif.payload ?? null,
                priority: notif.priority ?? "normal",
              });
            }
          }
        }
      } catch (e) {
        console.warn("[RealtimeNotificationHandler] Error cargando notificaciones existentes:", e);
      }
    })();

    let retryCount = 0;
    const MAX_RETRIES = 3;

    const subscribe = () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }

      const channelId = `notifications-${userId}-${Math.random().toString(36).substring(7)}`;
      console.log(`[RealtimeNotificationHandler] Intentando suscripción (${retryCount}):`, channelId);

      const channel = supabase.channel(channelId);
      channelRef.current = channel;

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            const notification = payload.new;
            if (!notification) return;

            const type = String(notification.type || "").toLowerCase();

            void notificar({
              userId: notification.user_id ?? userId,
              type,
              title: notification.title ?? "",
              body: notification.body ?? "",
              payload: notification.payload ?? null,
              priority: notification.priority ?? "normal",
            });

            if (type === "transferencia_admin_aceptada") {
              markTransferAccepted(notification.payload?.requestId);
            }
          }
        )
        .subscribe((status: string) => {
          console.log(`[RealtimeNotificationHandler] Estado: ${status} | Canal: ${channelId}`);

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`[RealtimeNotificationHandler] Reintentando en 2s... (${retryCount}/${MAX_RETRIES})`);
              setTimeout(subscribe, 2000);
            }
          } else if (status === 'SUBSCRIBED') {
            retryCount = 0;
          }
        });
    };

    subscribe();

    return () => {
      if (channelRef.current) {
        console.log("[RealtimeNotificationHandler] Desconectando canal:", channelRef.current.topic);
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, pushNotification, markTransferAccepted, notificar]);

  return null;
}
