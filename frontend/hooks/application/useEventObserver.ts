import { supabase } from "@/lib/supabase"
import { useNotificationStore } from "@/store/useNotificationStore"
import { useCallback, useEffect, useRef } from "react"

export function useEventObserver(subscribedCategoryIds: string[]) {
  const pushNotification = useNotificationStore((s) => s.pushNotification)
  const subsRef = useRef(subscribedCategoryIds)
  subsRef.current = subscribedCategoryIds

  const handleInsert = useCallback(
    (payload: any) => {
      const newEvent = payload.new
      if (!newEvent?.id) return

      const categoryId = newEvent.category_id
      if (!categoryId || !subsRef.current.includes(categoryId)) return

      pushNotification({
        id: `event-${newEvent.id}`,
        type: "nuevo_evento",
        title: "Nuevo evento",
        body: newEvent.title || "Nuevo evento disponible",
        priority: "normal",
        action: {
          label: "Ver evento",
          endpoint: `/eventos/${newEvent.id}`,
        },
        payload: { eventId: newEvent.id, categoryId },
      })
    },
    [pushNotification],
  )

  useEffect(() => {
    if (subscribedCategoryIds.length === 0) return

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
  }, [subscribedCategoryIds.length > 0, handleInsert])
}
