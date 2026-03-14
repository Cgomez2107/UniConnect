import type { StudyResource } from "@/types"

/**
 * Interface for StudyResource repository.
 * Defines contract for study resource data access (US-006).
 */
export interface IStudyResourceRepository {
  getById(id: string): Promise<StudyResource | null>
  getBySubject(subjectId: string): Promise<StudyResource[]>
  getByUser(userId: string): Promise<StudyResource[]>
  create(userId: string, programId: string, payload: { subject_id: string; title: string; description?: string; file_url: string; file_name: string; file_type?: string; file_size_kb?: number }): Promise<StudyResource>
  update(resourceId: string, userId: string, payload: { title?: string; description?: string | null }): Promise<StudyResource>
  delete(resourceId: string, userId: string): Promise<void>
}
