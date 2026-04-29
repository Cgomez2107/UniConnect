import { supabase } from "@/lib/supabase"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const PAGE_SIZE = 10

interface FeedSubject {
  id: string
  name: string
}

interface FeedFilters {
  search?: string
  subjectIds?: string[]
}

interface FeedStudyRequest {
  id: string
  author_id: string
  subject_id: string
  title: string
  description: string
  max_members: number
  status: "abierta" | "cerrada"
  created_at: string
  author: {
    full_name: string
    avatar_url?: string
    career?: string
  }
  subject_name: string
  faculty_name: string
  applications_count?: number
  profiles?: { full_name: string; avatar_url: string | null }
}

async function getEnrolledSubjectsForUser(): Promise<FeedSubject[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No hay sesión activa.")

  const { data, error } = await supabase
    .from("user_subjects")
    .select(
      `
      subject_id,
      subjects (
        id,
        name
      )
    `
    )
    .eq("user_id", user.id)

  if (error) throw new Error(error.message || "No se pudieron cargar tus materias.")

  const rows: any[] = data ?? []
  const subjectRecord: Record<string, FeedSubject> = {}

  for (let i = 0; i < rows.length; i++) {
    const subjectsField = rows[i].subjects
    const subjectList = Array.isArray(subjectsField)
      ? subjectsField
      : subjectsField
      ? [subjectsField]
      : []

    for (let j = 0; j < subjectList.length; j++) {
      const s = subjectList[j]
      if (!s || !s.id) continue
      const sid = String(s.id)
      if (!subjectRecord[sid]) {
        subjectRecord[sid] = { id: sid, name: String(s.name) }
      }
    }
  }

  return Object.values(subjectRecord).sort((a, b) => a.name.localeCompare(b.name))
}

async function getFeedRequests(filters?: FeedFilters, page = 0, pageSize = 10): Promise<FeedStudyRequest[]> {
  let query = supabase
    .from("study_requests")
    .select(
      `
      id, author_id, subject_id, title, description,
      max_members, status, created_at,
      subjects (
        name,
        program_subjects (
          programs (
            faculties ( name )
          )
        )
      )
    `
    )
    .eq("is_active", true)
    .eq("status", "abierta")
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (filters?.subjectIds && filters.subjectIds.length > 0) {
    query = query.in("subject_id", filters.subjectIds)
  }

  if (filters?.search && filters.search.trim() !== "") {
    query = query.ilike("title", `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message || "No se pudo cargar el feed.")

  const rows: any[] = data ?? []
  const authorIds = rows.map((r) => r.author_id).filter(Boolean)

  let profilesById: Record<string, any> = {}
  if (authorIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        avatar_url,
        user_programs (
          is_primary,
          programs ( name )
        )
      `
      )
      .in("id", authorIds)

    if (profilesError) throw profilesError

    const map: Record<string, any> = {}
    for (let i = 0; i < (profilesData ?? []).length; i++) {
      const p: any = (profilesData ?? [])[i]
      if (p?.id) map[p.id] = p
    }
    profilesById = map
  }

  const result: FeedStudyRequest[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const authorProfile = profilesById[r.author_id] ?? null

    let facultyName = "Sin facultad"
    const psArr: any[] = r.subjects?.program_subjects ?? []
    if (psArr.length > 0) {
      const prog = Array.isArray(psArr[0]?.programs) ? psArr[0].programs[0] : psArr[0]?.programs
      const fac = Array.isArray(prog?.faculties) ? prog.faculties[0] : prog?.faculties
      if (fac?.name) facultyName = fac.name
    }

    let authorCareer = ""
    const upArr: any[] = authorProfile?.user_programs ?? []
    for (let j = 0; j < upArr.length; j++) {
      const up = upArr[j]
      if (up.is_primary) {
        const prog = Array.isArray(up.programs) ? up.programs[0] : up.programs
        authorCareer = prog?.name ?? ""
        break
      }
    }
    if (!authorCareer && upArr.length > 0) {
      const prog = Array.isArray(upArr[0].programs) ? upArr[0].programs[0] : upArr[0].programs
      authorCareer = prog?.name ?? ""
    }

    result.push({
      id: r.id,
      author_id: r.author_id,
      subject_id: r.subject_id,
      title: r.title,
      description: r.description,
      max_members: r.max_members,
      status: r.status,
      created_at: r.created_at,
      author: {
        full_name: authorProfile?.full_name ?? "Usuario",
        avatar_url: authorProfile?.avatar_url ?? undefined,
        career: authorCareer || undefined,
      },
      profiles: {
        full_name: authorProfile?.full_name ?? "Usuario",
        avatar_url: authorProfile?.avatar_url ?? null,
      },
      subject_name: r.subjects?.name ?? "Sin materia",
      faculty_name: facultyName,
      applications_count: 0,
    })
  }

  return result
}

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

  const formatFeedError = (e: unknown) => {
    const raw = e instanceof Error ? e.message : ""
    const msg = raw.toLowerCase()

    if (msg.includes("more than one relationship") && msg.includes("study_requests") && msg.includes("profiles")) {
      return "Estamos ajustando una relación de base de datos para solicitudes. Intenta de nuevo en unos segundos."
    }

    if (msg.includes("permission denied")) {
      return "Tu sesión no tiene permisos para ver esta información. Cierra sesión y vuelve a ingresar."
    }

    return raw || "No pudimos cargar el feed en este momento."
  }

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

    // Regla de negocio: si no hay materias inscritas, el feed de solicitudes debe quedar vacío.
    if (userSubjectIds.length === 0) {
      setRequests([])
      hasMoreRef.current = false
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      const filters: FeedFilters = {
        search: search.trim(),
        subjectIds: userSubjectIds,
      }
      const data = await getFeedRequests(filters, 0, PAGE_SIZE)
      setRequests(data)
      hasMoreRef.current = data.length >= PAGE_SIZE
    } catch (e: unknown) {
      setError(formatFeedError(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, userSubjectIds, subjectsResolved])

  // Initial load once subjects are resolved
  useEffect(() => {
    if (subjectsResolved) {
      fetchData()
    }
  }, [subjectsResolved, fetchData])

  // Refetch when search or filters change (after initial load)
  useEffect(() => {
    if (!subjectsResolved) return
    // Only re-fetch if we have subjects and search terms changed
    if (userSubjectIds.length > 0 && search.length > 0) {
      fetchData()
    }
  }, [search, userSubjectIds])

  const loadMore = useCallback(async () => {
    if (!subjectsResolved || loadingMore || !hasMoreRef.current || loading) return
    if (userSubjectIds.length === 0) return

    setLoadingMore(true)

    try {
      const nextPage = pageRef.current + 1
      const filters: FeedFilters = {
        search: search.trim(),
        subjectIds: userSubjectIds,
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
