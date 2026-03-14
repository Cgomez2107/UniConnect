import { DIContainer } from "@/lib/services/di/container"

const container = DIContainer.getInstance()

export async function getPrograms() {
  const useCase = container.getGetPrograms()
  return useCase.execute()
}

export async function getSubjectsByProgram(programId: string) {
  const useCase = container.getGetSubjectsByProgram()
  return useCase.execute(programId)
}

export async function addMySubject(userId: string, subjectId: string) {
  const useCase = container.getAddMySubject()
  return useCase.execute(userId, subjectId)
}

export async function getMyPrograms(userId: string) {
  const useCase = container.getGetMyPrograms()
  return useCase.execute(userId)
}

export async function getMySubjects(userId: string) {
  const useCase = container.getGetMySubjects()
  return useCase.execute(userId)
}

export async function getProfile(userId: string) {
  const useCase = container.getGetProfileByUserId()
  return useCase.execute(userId)
}

export async function removeMySubject(userId: string, subjectId: string) {
  const useCase = container.getRemoveMySubject()
  return useCase.execute(userId, subjectId)
}

export async function setPrimaryProgram(userId: string, programId: string) {
  const useCase = container.getSetPrimaryProgram()
  return useCase.execute(userId, programId)
}

export async function updateProfile(
  userId: string,
  updates: {
    bio?: string
    phone_number?: string | null
  }
) {
  const useCase = container.getUpdateMyProfile()
  return useCase.execute(userId, updates)
}

export async function uploadAvatar(userId: string, imageUri: string) {
  const useCase = container.getUploadMyAvatar()
  return useCase.execute(userId, imageUri)
}
