import type { Application } from "@/types"

export class ApplicationMapper {
  static toDomain(raw: any): Application {
    return {
      id: raw.id,
      request_id: raw.request_id,
      applicant_id: raw.applicant_id,
      message: raw.message,
      status: raw.status,
      reviewed_at: raw.reviewed_at,
      created_at: raw.created_at,
      profiles: raw.profiles,
      study_requests: raw.study_requests,
    } as Application
  }

  static toPersistence(domain: Application): Record<string, unknown> {
    return {
      id: domain.id,
      request_id: domain.request_id,
      applicant_id: domain.applicant_id,
      message: domain.message,
      status: domain.status,
      reviewed_at: domain.reviewed_at,
    }
  }
}
