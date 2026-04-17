import { DIContainer } from "@/lib/services/di/container"
import type { CampusEvent, EventCategory } from "@/types"
import { useCallback, useEffect, useMemo, useState } from "react"

export type EventFilter = EventCategory | "todos" | "pasados"

export function useEvents() {
  const container = useMemo(() => DIContainer.getInstance(), [])
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<EventFilter>("todos")

  const load = useCallback(async (isRefresh = false, filterToLoad: EventFilter = activeFilter) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      let data: CampusEvent[] = [];
      if (filterToLoad === "pasados") {
        const useCase = container.getGetAllEvents()
        const allEvents = await useCase.execute()
        // Filtrar solo los pasados localmente
        const now = new Date()
        data = allEvents.filter((e: CampusEvent) => new Date(e.event_date) < now)
      } else {
        const useCase = container.getGetUpcomingEvents()
        data = await useCase.execute()
      }
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [container, activeFilter])

  // Recargar eventos si cambiamos de "pasados" a filtro normal o viceversa
  // Porque la fuente de datos (GetAll vs GetUpcoming) cambia
  useEffect(() => {
    load(false, activeFilter)
  }, [activeFilter, load])

  const filteredEvents = useMemo(() => {
    if (activeFilter === "todos" || activeFilter === "pasados") return events
    return events.filter((e) => e.category === activeFilter)
  }, [events, activeFilter])

  return {
    events,
    filteredEvents,
    isLoading,
    isRefreshing,
    activeFilter,
    setActiveFilter,
    refresh: () => load(true, activeFilter),
  }
}
