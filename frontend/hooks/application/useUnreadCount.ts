/**
 * hooks/application/useUnreadCount.ts
 * Hook para obtener el count de mensajes no-leídos
 */

import { DIContainer } from "@/lib/services/di/container";
import { useAuthStore } from "@/store/useAuthStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

export function useUnreadCount() {
  const container = useMemo(() => DIContainer.getInstance(), []);
  const getConversations = useMemo(() => container.getGetConversations(), [container]);
  
  // Obtener el usuario del auth store
  const user = useAuthStore((s) => s.user);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Si no hay usuario autenticado, no hacer nada
      if (!user?.id) {
        setUnreadCount(0);
        return;
      }

      setIsLoading(true);
      // Obtener todas las conversaciones con sus unread_count
      const conversations = await getConversations.execute();
      
      // Contar el total de unread_count de todas
      const total = conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [getConversations, user?.id]);

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
