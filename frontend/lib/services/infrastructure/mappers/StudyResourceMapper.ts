import type { StudyResource } from "@/types"

export class StudyResourceMapper {
  static toDomain(raw: any): StudyResource {
    return {
      id: raw.id,
      user_id: raw.user_id,
      program_id: raw.program_id,
      subject_id: raw.subject_id,
      title: raw.title,
      description: raw.description,
      file_url: raw.file_url,
      file_name: raw.file_name,
      file_type: raw.file_type,
      file_size_kb: raw.file_size_kb,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      profiles: raw.profiles,
    } as StudyResource
  }

  static toPersistence(domain: StudyResource): Record<string, unknown> {
    return {
      id: domain.id,
      user_id: domain.user_id,
      program_id: domain.program_id,
      subject_id: domain.subject_id,
      title: domain.title,
      description: domain.description,
      file_url: domain.file_url,
      file_name: domain.file_name,
      file_type: domain.file_type,
      file_size_kb: domain.file_size_kb,
    }
  }
}
