import { useState, useCallback } from "react"
import { DIContainer } from "@/lib/services/di/container"
import type { Application } from "@/types"

interface UseApplicationsState {
  loading: boolean
  error: string | null
  data: Application[]
}

export function useApplications() {
  const container = DIContainer.getInstance()
  const [state, setState] = useState<UseApplicationsState>({
    loading: false,
    error: null,
    data: [],
  })

  const applyToRequest = useCallback(
    async (requestId: string, applicantId: string, message: string, applicantName?: string) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getApplyToStudyRequest()
        await useCase.execute({ requestId, applicantId, message, applicantName })
        setState((prev) => ({ ...prev, loading: false, error: null }))
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al aplicar a solicitud"
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getApplicationsForRequest = useCallback(
    async (requestId: string, userId: string) => {
      setState({ loading: true, error: null, data: [] })
      try {
        const useCase = container.getGetApplicationsForRequest()
        const result = await useCase.execute({ requestId, userId })
        setState({ loading: false, error: null, data: result })
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al cargar aplicaciones"
        setState({ loading: false, error: errorMsg, data: [] })
        throw err
      }
    },
    [container]
  )

  const reviewApplication = useCallback(
    async (
      applicationId: string,
      reviewerId: string,
      decision: "aceptada" | "rechazada"
    ) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getReviewApplication()
        await useCase.execute({ applicationId, reviewerId, decision })
        setState((prev) => ({ ...prev, loading: false, error: null }))
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al revisar aplicación"
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getMyApplicationStatus = useCallback(
    async (requestId: string, userId: string) => {
      try {
        const useCase = container.getGetMyApplicationStatus()
        return await useCase.execute(requestId, userId)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al validar postulación"
        setState((prev) => ({ ...prev, error: errorMsg }))
        return null
      }
    },
    [container]
  )

  const getApplicationsByRequest = useCallback(
    async (requestId: string) => {
      const useCase = container.getGetApplicationsByRequest()
      return useCase.execute(requestId)
    },
    [container]
  )

  const getReceivedByAuthor = useCallback(
    async (authorId: string) => {
      const useCase = container.getGetReceivedApplicationsByAuthor()
      return useCase.execute(authorId)
    },
    [container]
  )

  const getByApplicant = useCallback(
    async (applicantId: string) => {
      const useCase = container.getGetApplicationsByApplicant()
      return useCase.execute(applicantId)
    },
    [container]
  )

  const cancelMyApplication = useCallback(
    async (requestId: string, userId: string) => {
      const useCase = container.getCancelApplication()
      return useCase.execute(requestId, userId)
    },
    [container]
  )

  return {
    ...state,
    applyToRequest,
    getApplicationsForRequest,
    reviewApplication,
    getMyApplicationStatus,
    getApplicationsByRequest,
    getReceivedByAuthor,
    getByApplicant,
    cancelMyApplication,
  }
}
