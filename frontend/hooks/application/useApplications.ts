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
    async (requestId: string, applicantId: string, message: string) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getApplyToStudyRequest()
        await useCase.execute({ requestId, applicantId, message })
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
        const repository = container.getApplicationRepository()
        return await repository.getMyApplicationStatus(requestId, userId)
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
      const repository = container.getApplicationRepository()
      return repository.getByRequest(requestId)
    },
    [container]
  )

  const getReceivedByAuthor = useCallback(
    async (authorId: string) => {
      const repository = container.getApplicationRepository()
      return repository.getReceivedByAuthor(authorId)
    },
    [container]
  )

  const getByApplicant = useCallback(
    async (applicantId: string) => {
      const repository = container.getApplicationRepository()
      return repository.getByApplicant(applicantId)
    },
    [container]
  )

  const cancelMyApplication = useCallback(
    async (requestId: string, userId: string) => {
      const repo = container.getApplicationRepository()
      return repo.cancel(requestId, userId)
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
