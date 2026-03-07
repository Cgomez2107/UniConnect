/**
 * hooks/useStudentSearch.ts
 * Hook para búsqueda de compañeros por materia — US-005
 *
 * Gestiona:
 *   - Selección de materia para buscar compañeros
 *   - Llamada al servicio searchStudentsBySubject
 *   - Paginación básica (load more)
 *   - Estados de carga / error / vacío
 *
 * Se integra con el feed: cuando el usuario escribe en la barra de búsqueda,
 * la pantalla decide si mostrar resultados de solicitudes o de estudiantes.
 */

import { searchStudentsBySubject } from "@/lib/services/studentService"
import {
  getEnrolledSubjectsForUser,
  Subject as FeedSubject,
} from "@/lib/services/studyRequestsService"
import type { StudentSearchResult } from "@/types"
import { useCallback, useEffect, useRef, useState } from "react"

const PAGE_SIZE = 20

interface UseStudentSearchReturn {
  /** Estudiantes encontrados */
  students: StudentSearchResult[]
  /** Materias del usuario para el selector */
  userSubjects: FeedSubject[]
  /** Materia seleccionada actualmente */
  selectedSubjectId: string | null
  /** Seleccionar materia y disparar búsqueda */
  selectSubject: (subjectId: string | null) => void
  /** Estados */
  loading: boolean
  loadingMore: boolean
  error: string | null
  /** Si hay más páginas disponibles */
  hasMore: boolean
  /** Cargar siguiente página */
  loadMore: () => void
  /** Refrescar búsqueda actual */
  refresh: () => void
}

export function useStudentSearch(): UseStudentSearchReturn {
  const [students, setStudents] = useState<StudentSearchResult[]>([])
  const [userSubjects, setUserSubjects] = useState<FeedSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(0)
  const hasMoreRef = useRef(false)

  // Cargar materias del usuario al montar
  useEffect(() => {
    getEnrolledSubjectsForUser()
      .then((subjects) => setUserSubjects(subjects))
      .catch(() => setUserSubjects([]))
  }, [])

  // Buscar estudiantes cuando cambia la materia seleccionada
  const fetchStudents = useCallback(
    async (subjectId: string, isRefresh = false) => {
      if (!isRefresh) setLoading(true)
      setError(null)
      pageRef.current = 0

      try {
        const data = await searchStudentsBySubject(subjectId, 0, PAGE_SIZE)
        setStudents(data)
        hasMoreRef.current = data.length >= PAGE_SIZE
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Error al buscar compañeros."
        )
        setStudents([])
        hasMoreRef.current = false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Seleccionar materia y disparar búsqueda
  const selectSubject = useCallback(
    (subjectId: string | null) => {
      setSelectedSubjectId(subjectId)
      if (subjectId) {
        fetchStudents(subjectId)
      } else {
        // Limpiar resultados si se deselecciona
        setStudents([])
        hasMoreRef.current = false
      }
    },
    [fetchStudents]
  )

  // Paginación: cargar más resultados
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current || !selectedSubjectId) return
    setLoadingMore(true)

    try {
      const nextPage = pageRef.current + 1
      const data = await searchStudentsBySubject(
        selectedSubjectId,
        nextPage,
        PAGE_SIZE
      )
      if (data.length > 0) {
        setStudents((prev) => [...prev, ...data])
        pageRef.current = nextPage
      }
      hasMoreRef.current = data.length >= PAGE_SIZE
    } catch {
      // Silenciar errores de paginación
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, selectedSubjectId])

  // Refrescar búsqueda actual
  const refresh = useCallback(() => {
    if (selectedSubjectId) {
      fetchStudents(selectedSubjectId, true)
    }
  }, [selectedSubjectId, fetchStudents])

  return {
    students,
    userSubjects,
    selectedSubjectId,
    selectSubject,
    loading,
    loadingMore,
    error,
    hasMore: hasMoreRef.current,
    loadMore,
    refresh,
  }
}
