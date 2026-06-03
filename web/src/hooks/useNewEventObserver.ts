import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { snakeToCamel } from "@uniconnect/shared-api";
import { useNotificationStore } from "@/store/useNotificationStore";

const CATEGORY_LABELS: Record<string, string> = {
  academico: "Académico",
  cultural: "Cultural",
  deportivo: "Deporte",
  otro: "Otro",
};

export function useNewEventObserver(subscribedCategories: string[]) {
  const subsRef = useRef(subscribedCategories);
  subsRef.current = subscribedCategories;

  useEffect(() => {
    if (subscribedCategories.length === 0) return;

    const channel = supabase
      .channel("new-campus-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
        },
        (payload) => {
          const newEvent = snakeToCamel(payload.new) as any;
          if (!newEvent?.id) return;

          const category = newEvent.category;
          if (!category || !subsRef.current.includes(category)) return;

          const label = CATEGORY_LABELS[category] || category;
          useNotificationStore.getState().addNotification({
            id: `event-${newEvent.id}`,
            userId: "",
            type: "system",
            title: `Nuevo evento ${label}`,
            description: newEvent.title || "Nuevo evento disponible",
            read: false,
            createdAt: new Date().toISOString(),
            data: { eventId: newEvent.id, category },
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[useNewEventObserver] Observing new events");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscribedCategories.length > 0]);
}
