/**
 * hooks/useFeed.ts
 *
 * Encapsula TODA la lógica de datos del feed:
 * - Carga de solicitudes (con filtros de modalidad y búsqueda)
 * - Pull-to-refresh
 * - Filtro local de facultad
 * - Derivación de facultades únicas
 * - Estado de carga / error
 *
 * La pantalla feed.tsx solo orquesta UI — este hook hace el trabajo pesado.
 */

import {
  FeedFilters,
  FeedStudyRequest,
  getFeedRequests,
} from "@/lib/services/studyRequestsService"
import { useCallback, useEffect, useMemo, useState } from "react"

export const MODALITIES = ["Todos", "presencial", "virtual", "híbrido"] as const
export type Modality = (typeof MODALITIES)[number]

interface UseFeedReturn {
  // Datos
  filtered: FeedStudyRequest[]
  faculties: string[]
  // Estado
  loading: boolean
  refreshing: boolean
  error: string | null
  // Filtros
  search: string
  setSearch: (v: string) => void
  selectedFaculty: string | null
  setSelectedFaculty: (v: string | null) => void
  selectedModality: string
  setSelectedModality: (v: string) => void
  activeFilters: number
  // Acciones
  refresh: () => void
}

export function useFeed(): UseFeedReturn {
  const [requests, setRequests] = useState<FeedStudyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null)
  const [selectedModality, setSelectedModality] = useState("Todos")

  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)

    try {
      const filters: FeedFilters = {
        modality: selectedModality,
        search: search.trim(),
      }
      const data = await getFeedRequests(filters)
      setRequests(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar el feed.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedModality, search])

  useEffect(() => { fetchData() }, [fetchData])

  // Filtro local de facultad (sin nueva llamada al backend)
  const filtered = useMemo(() => {
    if (!selectedFaculty) return requests
    return requests.filter((r) => r.faculty_name === selectedFaculty)
  }, [requests, selectedFaculty])

  // Facultades únicas presentes en el feed cargado
  const faculties = useMemo(() => {
    const seen = new Set<string>()
    return requests
      .map((r) => r.faculty_name)
      .filter((name): name is string => {
        if (!name || seen.has(name)) return false
        seen.add(name)
        return true
      })
      .sort((a, b) => a.localeCompare(b))
  }, [requests])

  const activeFilters =
    (selectedFaculty ? 1 : 0) + (selectedModality !== "Todos" ? 1 : 0)

  return {
    filtered,
    faculties,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    selectedFaculty,
    setSelectedFaculty,
    selectedModality,
    setSelectedModality,
    activeFilters,
    refresh: () => fetchData(true),
  }
}
