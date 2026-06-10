import { DIContainer } from "@/lib/services/di/container"
import type { CampusEvent } from "@/types"
import { useCallback, useEffect, useMemo, useState } from "react"

export type EventFilter = string | "todos"

export function useEvents() {
  const container = useMemo(() => DIContainer.getInstance(), [])
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<EventFilter>("todos")

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const useCase = container.getGetAllEvents()
      const allEvents = await useCase.execute()
      const now = new Date()
      const data = allEvents.filter((e: CampusEvent) => new Date(e.event_date) >= now)
      setEvents(data)
    } catch (error) {
      console.warn("[useEvents] Error loading events:", error instanceof Error ? error.message : String(error))
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [container])

  useEffect(() => {
    load(false)
  }, [activeFilter, load])

  const filteredEvents = useMemo(() => {
    if (activeFilter === "todos") return events
    if (activeFilter.includes("-")) {
      return events.filter((e) => e.category_id === activeFilter)
    }
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
