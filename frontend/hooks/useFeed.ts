import {
  FeedFilters,
  FeedStudyRequest,
  getFeedRequests,
  getEnrolledSubjectsForUser,
  Subject as FeedSubject,
} from "@/lib/services/studyRequestsService"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const PAGE_SIZE = 10

/**
 * Return type for useFeed hook.
 */
interface UseFeedReturn {
  // Datos
  filtered: FeedStudyRequest[]
  userSubjects: FeedSubject[]
  // Estado
  loading: boolean
  refreshing: boolean
  loadingMore: boolean
  error: string | null
  // Filtros
  search: string
  setSearch: (v: string) => void
  selectedSubjects: string[]
  setSelectedSubjects: (v: string[]) => void
  activeFilters: number
  // Acciones
  refresh: () => void
  loadMore: () => void
}

/**
 * Hook for managing feed data, filters, and pagination.
 * Fetches study requests filtered by user's enrolled subjects.
 * Supports search, subject filtering, pull-to-refresh, and infinite scroll.
 */
export function useFeed(): UseFeedReturn {
  const [requests, setRequests] = useState<FeedStudyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSubjectIds, setUserSubjectIds] = useState<string[]>([])
  const [userSubjects, setUserSubjects] = useState<FeedSubject[]>([])
  const [subjectsResolved, setSubjectsResolved] = useState(false)

  const [search, setSearch] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)

  useEffect(() => {
    getEnrolledSubjectsForUser()
      .then((subjects) => {
        setUserSubjectIds(subjects.map((s) => s.id))
        setUserSubjects(subjects)
        setSubjectsResolved(true)
      })
      .catch(() => {
        setUserSubjectIds([])
        setUserSubjects([])
        setSubjectsResolved(true)
      })
  }, [])

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!subjectsResolved) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    pageRef.current = 0
    hasMoreRef.current = true

    try {
      const filters: FeedFilters = {
        search: search.trim(),
        subjectIds: userSubjectIds.length > 0 ? userSubjectIds : undefined,
      }
      const data = await getFeedRequests(filters, 0, PAGE_SIZE)
      setRequests(data)
      hasMoreRef.current = data.length >= PAGE_SIZE
    } catch (e: unknown) {
      const errMsg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "Error al cargar el feed."
      setError(errMsg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, userSubjectIds, subjectsResolved])

  useEffect(() => { fetchData() }, [fetchData])

  const loadMore = useCallback(async () => {
    if (!subjectsResolved || loadingMore || !hasMoreRef.current || loading) return
    setLoadingMore(true)

    try {
      const nextPage = pageRef.current + 1
      const filters: FeedFilters = {
        search: search.trim(),
        subjectIds: userSubjectIds.length > 0 ? userSubjectIds : undefined,
      }
      const data = await getFeedRequests(filters, nextPage, PAGE_SIZE)
      if (data.length > 0) {
        setRequests((prev) => [...prev, ...data])
        pageRef.current = nextPage
      }
      hasMoreRef.current = data.length >= PAGE_SIZE
    } catch {
      // No mostrar error en paginación, silenciar
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, loading, search, userSubjectIds, subjectsResolved])

  const filtered = useMemo(() => {
    if (selectedSubjects.length === 0) return requests
    return requests.filter((r) => selectedSubjects.includes(r.subject_id))
  }, [requests, selectedSubjects])

  const activeFilters = selectedSubjects.length

  return {
    filtered,
    userSubjects,
    loading,
    refreshing,
    loadingMore,
    error,
    search,
    setSearch,
    selectedSubjects,
    setSelectedSubjects,
    activeFilters,
    refresh: () => fetchData(true),
    loadMore,
  }
}
