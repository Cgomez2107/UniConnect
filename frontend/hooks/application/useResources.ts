import { useState, useCallback } from "react"
import { DIContainer } from "@/lib/services/di/container"
import type { StudyResource } from "@/types"

interface UseResourcesState {
  loading: boolean
  error: string | null
  data: StudyResource[]
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

export function useResources() {
  const container = DIContainer.getInstance()
  const [state, setState] = useState<UseResourcesState>({
    loading: false,
    error: null,
    data: [],
  })

  const getResourcesBySubject = useCallback(
    async (subjectId: string) => {
      setState({ loading: true, error: null, data: [] })
      try {
        const useCase = container.getGetStudyResourcesBySubject()
        const result = await useCase.execute(subjectId)
        setState({ loading: false, error: null, data: result })
        return result
      } catch (err) {
        const errorMsg = toErrorMessage(err, "Error al cargar recursos")
        setState({ loading: false, error: errorMsg, data: [] })
        throw err
      }
    },
    [container]
  )

  const uploadResource = useCallback(
    async (
      userId: string,
      programId: string,
      payload: {
        subject_id: string
        title: string
        description?: string
        file_url: string
        file_name: string
        file_type?: string
        file_size_kb?: number
      }
    ) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getUploadStudyResource()
        const result = await useCase.execute({
          userId,
          programId,
          ...payload,
        })
        setState((prev) => ({ ...prev, loading: false, error: null }))
        return result
      } catch (err) {
        const errorMsg = toErrorMessage(err, "Error al cargar recurso")
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getResourcesByUser = useCallback(
    async (userId: string) => {
      const useCase = container.getGetStudyResourcesByUser()
      return useCase.execute(userId)
    },
    [container]
  )

  const getResourceById = useCallback(
    async (resourceId: string) => {
      const useCase = container.getGetStudyResourceById()
      return useCase.execute(resourceId)
    },
    [container]
  )

  const updateResource = useCallback(
    async (resourceId: string, userId: string, payload: { title?: string; description?: string | null }) => {
      const useCase = container.getUpdateStudyResource()
      return useCase.execute(resourceId, userId, payload)
    },
    [container]
  )

  return {
    ...state,
    getResourcesBySubject,
    getResourcesByUser,
    getResourceById,
    updateResource,
    uploadResource,
  }
}
