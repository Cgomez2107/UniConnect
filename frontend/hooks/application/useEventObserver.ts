import { supabase } from "@/lib/supabase"
import { useNotificationStore } from "@/store/useNotificationStore"
import { useCallback, useEffect, useRef } from "react"

const CATEGORY_LABELS: Record<string, string> = {
  academico: "Académico",
  cultural: "Cultural",
  deportivo: "Deporte",
  otro: "Otro",
}

export function useEventObserver(subscribedCategories: string[]) {
  const pushNotification = useNotificationStore((s) => s.pushNotification)
  const subsRef = useRef(subscribedCategories)
  subsRef.current = subscribedCategories

  const handleInsert = useCallback(
    (payload: any) => {
      const newEvent = payload.new
      if (!newEvent?.id) return

      const category = newEvent.category
      if (!category || !subsRef.current.includes(category)) return

      const label = CATEGORY_LABELS[category] || category
      pushNotification({
        id: `event-${newEvent.id}`,
        type: "nuevo_evento",
        title: `Nuevo evento ${label}`,
        body: newEvent.title || "Nuevo evento disponible",
        priority: "normal",
        action: {
          label: "Ver evento",
          endpoint: `/eventos/${newEvent.id}`,
        },
        payload: { eventId: newEvent.id, category },
      })
    },
    [pushNotification],
  )

  useEffect(() => {
    if (subscribedCategories.length === 0) return

    const channel = supabase
      .channel("mobile-new-campus-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        handleInsert,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[useEventObserver] Observing new events")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [subscribedCategories.length > 0, handleInsert])
}
