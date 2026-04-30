import React, { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";

/**
 * RealtimeNotificationHandler
 * 
 * Componente global que escucha cambios en la tabla 'user_notifications'
 * y mapea los eventos a acciones del store.
 */
export function RealtimeNotificationHandler() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const markTransferAccepted = useNotificationStore((s) => s.markTransferAccepted);
  const channelRef = React.useRef<any>(null);

  useEffect(() => {
    if (!userId) {
      console.log("[RealtimeNotificationHandler] No hay userId, saltando suscripción.");
      return;
    }

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
            console.log("[RealtimeNotificationHandler] ¡EVENTO CAPTURADO!", payload);
            const notification = payload.new;
            if (!notification) return;

            const type = String(notification.type || "").toLowerCase();
            console.log("[RealtimeNotificationHandler] Procesando notificación:", type, notification.id);
            
            if (type === "transferencia_admin_aceptada") {
               markTransferAccepted(notification.payload.requestId);
            } else {
               pushNotification(notification as any);
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
  }, [userId, pushNotification, markTransferAccepted]);

  return null;
}
