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
  const setTransferData = useNotificationStore((s) => s.setTransferData);
  const markTransferAccepted = useNotificationStore((s) => s.markTransferAccepted);
  const showJoinRequestModal = useNotificationStore((s) => s.showJoinRequestModal);
  const showWelcomeModal = useNotificationStore((s) => s.showWelcomeModal);
  const channelRef = React.useRef<any>(null);

  useEffect(() => {
    if (!userId) {
      console.log("[RealtimeNotificationHandler] No hay userId, saltando suscripción.");
      return;
    }

    let retryCount = 0;
    const MAX_RETRIES = 3;

    const subscribe = () => {
      // Limpiar canal anterior si existe antes de reintentar
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

            if (!notification) {
              console.warn("[RealtimeNotificationHandler] Payload recibido sin datos (.new es nulo)");
              return;
            }

            const type = String(notification.type || "").toLowerCase();
            console.log("[RealtimeNotificationHandler] Procesando notificación:", type, notification.id);

            switch (type) {
              case "transferencia_admin_solicitada":
                setTransferData({
                  transferId: notification.payload.transferId,
                  requestId: notification.payload.requestId,
                  actorUserId: notification.payload.actorUserId,
                  groupName: notification.title,
                  senderName: notification.body,
                });
                break;

              case "transferencia_admin_aceptada":
                markTransferAccepted(notification.payload.requestId);
                break;

              case "solicitud_ingreso":
                showJoinRequestModal({
                  requestId: notification.payload.requestId,
                  applicantId: notification.payload.applicantId,
                  applicantName: notification.payload.applicantName || "Un estudiante",
                  groupName: notification.title,
                  message: notification.payload.message,
                });
                break;

              case "miembro_aceptado":
                showWelcomeModal(notification.title || "un nuevo grupo");
                break;

              default:
                console.log("[RealtimeNotificationHandler] Tipo no manejado:", type);
                break;
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
            } else {
              console.error("[RealtimeNotificationHandler] Se alcanzó el máximo de reintentos de suscripción.");
            }
          } else if (status === 'SUBSCRIBED') {
            retryCount = 0; // Reset al tener éxito
          }
        });
    };

    const timer = setTimeout(subscribe, 500);

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        console.log("[RealtimeNotificationHandler] Desconectando canal:", channelRef.current.topic);
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, setTransferData, markTransferAccepted, showJoinRequestModal, showWelcomeModal]);

  return null;
}
