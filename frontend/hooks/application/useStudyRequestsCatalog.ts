import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"

export interface Subject {
  id: string
  name: string
}

const container = DIContainer.getInstance()

export async function createStudyRequest(payload: {
  title: string
  description: string
  subject_id: string
  max_members: number
}) {
  const user = useAuthStore.getState().user
  if (!user?.id) throw new Error("No hay sesión activa.")

  const useCase = container.getCreateStudyRequest()

  return useCase.execute({
    userId: user.id,
    ...payload,
  })
}

export async function getAvailableSubjectsForCurrentUser() {
  const user = useAuthStore.getState().user
  if (!user?.id) throw new Error("No hay sesión activa.")

  const useCase = container.getGetAvailableSubjectsForUser()
  return useCase.execute(user.id)
}

export async function getEnrolledSubjectsForUser() {
  const user = useAuthStore.getState().user
  if (!user?.id) throw new Error("No hay sesión activa.")

  const useCase = container.getGetEnrolledSubjectsForUser()
  return useCase.execute(user.id)
}

export async function getStudyRequestCountBySubject(subjectId: string) {
  const repo = container.getStudyRequestRepository()
  return repo.countBySubject(subjectId)
}
