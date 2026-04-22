/**
 * hooks/application/useUnreadCount.ts
 * Hook para obtener el count de mensajes no-leídos
 */

import { useAuthStore } from "@/store/useAuthStore";
import { useUnreadCountStore } from "@/store/unreadCountStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useUnreadCount() {
  // Obtener el usuario del auth store
  const user = useAuthStore((s) => s.user);

  const unreadCount = useUnreadCountStore((s) => s.totalUnreadCount);
  const refreshUnreadCount = useUnreadCountStore((s) => s.refreshUnreadCount);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Si no hay usuario autenticado, no hacer nada
      if (!user?.id) {
        return;
      }

      setIsLoading(true);
      await refreshUnreadCount();
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUnreadCount, user?.id]);

  // Refresh cada vez que el tab se enfoca
  useFocusEffect(
    useCallback(() => {
      // Solo ejecutar si hay usuario autenticado
      if (user?.id) {
        void fetchUnreadCount();
      }
    }, [fetchUnreadCount, user?.id])
  );

  return { unreadCount, isLoading, refetch: fetchUnreadCount };
}
