import { DIContainer } from "@/lib/services/di/container"
import type { CampusEvent, EventCategory } from "@/types"
import { useCallback, useEffect, useMemo, useState } from "react"

export type EventFilter = EventCategory | "todos"

export function useEvents() {
  const container = DIContainer.getInstance()
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<EventFilter>("todos")

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const useCase = container.getGetUpcomingEvents()
      const data = await useCase.execute()
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [container])

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
