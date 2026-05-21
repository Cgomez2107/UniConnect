import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getWsUrl } from "@/lib/wsUrl";

const WS_URL = getWsUrl();

export function useNotificationWebSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectAttempts = 0;
    const maxAttempts = 5;

    const connect = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        ws.send(JSON.stringify({ type: "subscribe", channel: "notifications" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.event === "notification" ||
            data.event === "notification:new" ||
            data.event === "new_notification"
          ) {
            const notif = data.payload || data;
            const store = useNotificationStore.getState();
            store.addNotification(notif);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (reconnectAttempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectAttempts++;
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
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated]);
}
