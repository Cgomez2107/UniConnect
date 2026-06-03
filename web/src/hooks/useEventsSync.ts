import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventsStore } from "@/store/useEventsStore";
import { getWsUrl } from "@/lib/wsUrl";

const WS_URL = getWsUrl();

/**
 * Suscribe al canal global de eventos via Gateway WebSocket.
 * Actualiza el useEventsStore en tiempo real cuando otro usuario crea,
 * edita o elimina un evento — sin necesidad de recargar la página.
 *
 * Úsalo en el componente raíz de la sección de eventos (EventosPage o similar).
 */
export function useEventsSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectAttempts = 0;
    const maxAttempts = 5;

    const connect = () => {
      const raw = localStorage.getItem("uniconnect-auth-session");
      const token = raw ? (JSON.parse(raw)?.state?.accessToken ?? null) : null;
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        console.log("[useEventsSync] WebSocket connected — subscribing to events channel");
        ws.send(JSON.stringify({ type: "subscribe", channel: "events" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const store = useEventsStore.getState();

          console.log("[useEventsSync] Received:", data.event, data.payload);

          switch (data.event) {
            case "new_event": {
              store.addEvent(data.payload);
              break;
            }
            case "event_updated": {
              store.updateEvent(data.payload);
              break;
            }
            case "event_deleted": {
              store.removeEvent(data.payload.id);
              break;
            }
            default:
              break;
          }
        } catch (e) {
          console.error("[useEventsSync] Error processing message:", e);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (reconnectAttempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectAttempts++;
          console.log(`[useEventsSync] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "unsubscribe", channel: "events" }));
        }
        wsRef.current.close();
      }
    };
  }, [isAuthenticated]);
}

export default useEventsSync;
