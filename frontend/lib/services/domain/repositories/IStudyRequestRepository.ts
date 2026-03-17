import type { StudyRequest } from "@/types"

export interface UserSubjectCatalogItem {
  id: string
  name: string
}

export interface RequestAdminEntry {
  user_id: string
  full_name: string
  avatar_url: string | null
  granted_by: string
  created_at: string
}

export interface IStudyRequestRepository {
  getById(id: string): Promise<StudyRequest | null>
  getFeed(
    filters?: { subjectIds?: string[]; subject_id?: string; search?: string },
    page?: number,
    pageSize?: number
  ): Promise<StudyRequest[]>
  getByAuthor(userId: string): Promise<StudyRequest[]>
  getEnrolledSubjects(userId: string): Promise<UserSubjectCatalogItem[]>
  getAvailableSubjectsForUser(userId: string): Promise<UserSubjectCatalogItem[]>
  create(userId: string, payload: { title: string; description: string; subject_id: string; max_members: number }): Promise<StudyRequest>
  updateStatus(requestId: string, status: "abierta" | "cerrada" | "expirada"): Promise<void>
  updateContent(requestId: string, userId: string, payload: { title?: string; description?: string }): Promise<void>
  cancel(requestId: string, userId: string): Promise<void>
  isAdmin(requestId: string, userId: string): Promise<boolean>
  getAdmins(requestId: string): Promise<RequestAdminEntry[]>
  assignAdmin(requestId: string, targetUserId: string, actorUserId: string): Promise<void>
  revokeAdmin(requestId: string, targetUserId: string, actorUserId: string): Promise<void>
}
