/**
 * hooks/useResources.ts
 * Hook para gestión de recursos de estudio — US-006
 *
 * Funcionalidades:
 *  - Listado de recursos por materia (paginación)
 *  - Listado de mis recursos
 *  - Subida de recurso (con validación)
 *  - Eliminación de recurso
 *  - Pull-to-refresh
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import {
  getResourcesBySubject,
  getMyResources,
  uploadResource,
  deleteResource,
  validateFileFormat,
  validateFileSize,
} from "@/lib/services/resourceService"
import type { StudyResource, CreateStudyResourcePayload } from "@/types"

const PAGE_SIZE = 20

// ── Hook: listar recursos por materia ─────────────────────────────────────────

interface UseResourceListReturn {
  resources: StudyResource[]
  loading: boolean
  refreshing: boolean
  loadingMore: boolean
  error: string | null
  refresh: () => void
  loadMore: () => void
}

export function useResourceList(subjectId: string | null): UseResourceListReturn {
  const [resources, setResources] = useState<StudyResource[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!subjectId) {
        setResources([])
        setLoading(false)
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      pageRef.current = 0
      hasMoreRef.current = true

      try {
        const data = await getResourcesBySubject(subjectId, 0, PAGE_SIZE)
        setResources(data)
        hasMoreRef.current = data.length >= PAGE_SIZE
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar recursos.")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [subjectId]
  )

  // Efecto: cargar al cambiar de materia
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current || loading || !subjectId) return
    setLoadingMore(true)

    try {
      const nextPage = pageRef.current + 1
      const data = await getResourcesBySubject(subjectId, nextPage, PAGE_SIZE)
      if (data.length > 0) {
        setResources((prev) => [...prev, ...data])
        pageRef.current = nextPage
      }
      hasMoreRef.current = data.length >= PAGE_SIZE
    } catch {
      // Silenciar error en paginación
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, loading, subjectId])

  return { resources, loading, refreshing, loadingMore, error, refresh, loadMore }
}

// ── Hook: mis recursos ───────────────────────────────────────────────────────

export function useMyResources(): UseResourceListReturn {
  const user = useAuthStore((s) => s.user)
  const [resources, setResources] = useState<StudyResource[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!user) return
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      pageRef.current = 0
      hasMoreRef.current = true

      try {
        const data = await getMyResources(user.id, 0, PAGE_SIZE)
        setResources(data)
        hasMoreRef.current = data.length >= PAGE_SIZE
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar tus recursos.")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [user]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current || loading || !user) return
    setLoadingMore(true)

    try {
      const nextPage = pageRef.current + 1
      const data = await getMyResources(user.id, nextPage, PAGE_SIZE)
      if (data.length > 0) {
        setResources((prev) => [...prev, ...data])
        pageRef.current = nextPage
      }
      hasMoreRef.current = data.length >= PAGE_SIZE
    } catch {
      // Silenciar error en paginación
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, loading, user])

  return { resources, loading, refreshing, loadingMore, error, refresh, loadMore }
}

// ── Hook: subir recurso ──────────────────────────────────────────────────────

interface UseUploadResourceReturn {
  uploading: boolean
  error: string | null
  upload: (
    payload: CreateStudyResourcePayload & {
      file_name: string
      file_size_bytes: number
    }
  ) => Promise<StudyResource | null>
  validateFile: (fileName: string, sizeBytes: number) => string | null
}

export function useUploadResource(): UseUploadResourceReturn {
  const user = useAuthStore((s) => s.user)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback(
    (fileName: string, sizeBytes: number): string | null => {
      if (!validateFileFormat(fileName)) {
        return "Formato no permitido. Usa: pdf, docx, xlsx, pptx, txt, jpg, png."
      }
      if (!validateFileSize(sizeBytes)) {
        return "El archivo excede el máximo de 10 MB."
      }
      return null
    },
    []
  )

  const upload = useCallback(
    async (
      payload: CreateStudyResourcePayload & {
        file_name: string
        file_size_bytes: number
      }
    ): Promise<StudyResource | null> => {
      if (!user) {
        setError("Sesión no válida.")
        return null
      }

      setUploading(true)
      setError(null)

      try {
        const resource = await uploadResource(user.id, payload)
        return resource
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error al subir recurso."
        setError(msg)
        return null
      } finally {
        setUploading(false)
      }
    },
    [user]
  )

  return { uploading, error, upload, validateFile }
}

// ── Hook: eliminar recurso ───────────────────────────────────────────────────

interface UseDeleteResourceReturn {
  deleting: boolean
  error: string | null
  remove: (resourceId: string, fileUrl: string) => Promise<boolean>
}

export function useDeleteResource(): UseDeleteResourceReturn {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(
    async (resourceId: string, fileUrl: string): Promise<boolean> => {
      setDeleting(true)
      setError(null)

      try {
        await deleteResource(resourceId, fileUrl)
        return true
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error al eliminar recurso."
        setError(msg)
        return false
      } finally {
        setDeleting(false)
      }
    },
    []
  )

  return { deleting, error, remove }
}
