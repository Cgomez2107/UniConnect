import type { Profile, UserProgram, UserSubject } from "@/types"

export interface IProfileRepository {
  getProfile(userId: string): Promise<Profile | null>
  updateProfile(
    userId: string,
    updates: {
      bio?: string
      phone_number?: string | null
    }
  ): Promise<Profile>
  uploadAvatar(userId: string, imageUri: string): Promise<string>
  getMyPrograms(userId: string): Promise<UserProgram[]>
  setPrimaryProgram(userId: string, programId: string): Promise<void>
  getMySubjects(userId: string): Promise<UserSubject[]>
  addMySubject(userId: string, subjectId: string): Promise<void>
  removeMySubject(userId: string, subjectId: string): Promise<void>
}
