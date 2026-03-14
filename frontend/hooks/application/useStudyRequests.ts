import { useState, useCallback } from "react"
import { DIContainer } from "@/lib/services/di/container"
import type { StudyRequest } from "@/types"

interface UseStudyRequestsState {
  loading: boolean
  error: string | null
  data: StudyRequest[]
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

export function useStudyRequests() {
  const container = DIContainer.getInstance()
  const [state, setState] = useState<UseStudyRequestsState>({
    loading: false,
    error: null,
    data: [],
  })

  const getRequests = useCallback(
    async (filters?: { subject_id?: string; search?: string }, page = 0, pageSize = 10) => {
      setState({ loading: true, error: null, data: [] })
      try {
        const useCase = container.getGetFeedRequests()
        const result = await useCase.execute(filters, page, pageSize)
        setState({ loading: false, error: null, data: result })
        return result
      } catch (err) {
        const errorMsg = toErrorMessage(err, "Error al cargar solicitudes")
        setState({ loading: false, error: errorMsg, data: [] })
        throw err
      }
    },
    [container]
  )

  const createRequest = useCallback(
    async (
      userId: string,
      payload: { title: string; description: string; subject_id: string; max_members: number }
    ) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getCreateStudyRequest()
        await useCase.execute({ userId, ...payload })
        setState((prev) => ({ ...prev, loading: false, error: null }))
      } catch (err) {
        const errorMsg = toErrorMessage(err, "Error al crear solicitud")
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const updateStatus = useCallback(
    async (requestId: string, _userId: string, status: "abierta" | "cerrada" | "expirada") => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getUpdateStudyRequestStatus()
        await useCase.execute(requestId, status)
        setState((prev) => ({ ...prev, loading: false, error: null }))
      } catch (err) {
        const errorMsg = toErrorMessage(err, "Error al actualizar solicitud")
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getRequestById = useCallback(
    async (requestId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const useCase = container.getGetStudyRequestById()
        const result = await useCase.execute(requestId)
        setState((prev) => ({ ...prev, loading: false }))
        return result
      } catch (err) {
        const errorMsg = toErrorMessage(err, "Error al cargar solicitud")
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getRequestsByAuthor = useCallback(
    async (authorId: string) => {
      const useCase = container.getGetStudyRequestsByAuthor()
      return useCase.execute(authorId)
    },
    [container]
  )

  const isAdmin = useCallback(
    async (requestId: string, userId: string) => {
      const useCase = container.getIsStudyRequestAdmin()
      return useCase.execute(requestId, userId)
    },
    [container]
  )

  const getAdmins = useCallback(
    async (requestId: string) => {
      const useCase = container.getGetStudyRequestAdmins()
      return useCase.execute(requestId)
    },
    [container]
  )

  const assignAdmin = useCallback(
    async (requestId: string, targetUserId: string, actorUserId: string) => {
      const useCase = container.getAssignStudyRequestAdmin()
      return useCase.execute(requestId, targetUserId, actorUserId)
    },
    [container]
  )

  const revokeAdmin = useCallback(
    async (requestId: string, targetUserId: string, actorUserId: string) => {
      const useCase = container.getRevokeStudyRequestAdmin()
      return useCase.execute(requestId, targetUserId, actorUserId)
    },
    [container]
  )

  const updateRequestContent = useCallback(
    async (requestId: string, userId: string, payload: { title?: string; description?: string }) => {
      const useCase = container.getUpdateStudyRequestContent()
      return useCase.execute(requestId, userId, payload)
    },
    [container]
  )

  const cancelRequest = useCallback(
    async (requestId: string, userId: string) => {
      const useCase = container.getCancelStudyRequest()
      return useCase.execute(requestId, userId)
    },
    [container]
  )

  return {
    ...state,
    getRequests,
    getRequestById,
    getRequestsByAuthor,
    createRequest,
    updateStatus,
    isAdmin,
    getAdmins,
    assignAdmin,
    revokeAdmin,
    updateRequestContent,
    cancelRequest,
  }
}
