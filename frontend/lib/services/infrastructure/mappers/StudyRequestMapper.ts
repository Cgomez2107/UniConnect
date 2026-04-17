import type { StudyRequest } from "@/types"

export class StudyRequestMapper {
  static toDomain(raw: any): StudyRequest {
    return {
      id: raw.id,
      author_id: raw.author_id,
      subject_id: raw.subject_id,
      title: raw.title,
      description: raw.description,
      max_members: raw.max_members,
      status: raw.status,
      is_active: raw.is_active,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      subjects: raw.subjects,
      applications_count: raw.applications_count,
    } as StudyRequest
  }

  static toPersistence(domain: StudyRequest): Record<string, unknown> {
    return {
      id: domain.id,
      author_id: domain.author_id,
      subject_id: domain.subject_id,
      title: domain.title,
      description: domain.description,
      max_members: domain.max_members,
      status: domain.status,
      is_active: domain.is_active,
    }
  }
}
