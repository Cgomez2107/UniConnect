// Hook para la vista de eventos del campus: carga próximos eventos y permite filtrar por categoría.

import { getUpcomingEvents } from "@/lib/services/eventService"
import type { CampusEvent, EventCategory } from "@/types"
import { useCallback, useEffect, useMemo, useState } from "react"

export type EventFilter = EventCategory | "todos"

export function useEvents() {
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<EventFilter>("todos")

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const data = await getUpcomingEvents()
      setEvents(data)
    } catch {
      // Silencioso: la pantalla muestra EmptyState
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredEvents = useMemo(() => {
    if (activeFilter === "todos") return events
    return events.filter((e) => e.category === activeFilter)
  }, [events, activeFilter])

  return {
    events,
    filteredEvents,
    isLoading,
    isRefreshing,
    activeFilter,
    setActiveFilter,
    refresh: () => load(true),
  }
}
