import { DIContainer } from "@/lib/services/di/container"
import type { CampusEvent, EventListFilters, EventListMeta } from "@/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type EventFilter = string | "todos"

export function useEvents() {
  const container = useMemo(() => DIContainer.getInstance(), [])
  const repo = useMemo(() => container.getEventRepository(), [container])

  const [events, setEvents] = useState<CampusEvent[]>([])
  const [meta, setMeta] = useState<EventListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState("published")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.length >= 3 ? search : "")
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const filters: EventListFilters = {
        page,
        limit: 10,
        status: selectedStatus,
      }
      if (debouncedSearch) filters.search = debouncedSearch
      if (selectedCategories.length > 0) filters.categories = selectedCategories

      const response = await repo.listEvents(filters)
      setEvents(response.data)
      setMeta(response.meta)
    } catch (error) {
      console.warn("[useEvents] Error loading events:", error instanceof Error ? error.message : String(error))
      setEvents([])
      setMeta({ total: 0, page: 1, limit: 10, totalPages: 0 })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [repo, page, debouncedSearch, selectedCategories, selectedStatus])

  useEffect(() => {
    load(false)
  }, [load])

  const goToPage = useCallback((p: number) => {
    if (p >= 1 && p <= meta.totalPages) setPage(p)
  }, [meta.totalPages])

  const toggleCategory = useCallback((catSlug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catSlug)
        ? prev.filter((c) => c !== catSlug)
        : [...prev, catSlug],
    )
    setPage(1)
  }, [])

  const clearCategories = useCallback(() => {
    setSelectedCategories([])
    setPage(1)
  }, [])

  const setStatus = useCallback((status: string) => {
    setSelectedStatus(status)
    setPage(1)
  }, [])

  return {
    events,
    meta,
    isLoading,
    isRefreshing,
    page,
    search,
    debouncedSearch,
    selectedCategories,
    selectedStatus,
    setSearch,
    setPage,
    goToPage,
    toggleCategory,
    clearCategories,
    setStatus,
    refresh: () => load(true),
  }
}
