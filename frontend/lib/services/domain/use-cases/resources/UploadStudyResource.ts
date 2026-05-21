import type { IStudyResourceRepository } from "../../repositories/IStudyResourceRepository"
import type { StudyResource } from "@/types"

export interface UploadResourcePayload {
  userId: string
  programId: string
  subject_id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_type?: string
  file_size_kb?: number
  og_title?: string | null
  og_description?: string | null
  og_image?: string | null
}

export class UploadStudyResource {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(payload: UploadResourcePayload): Promise<StudyResource> {
    this.validate(payload)

    return this.repository.create(payload.userId, payload.programId, {
      subject_id: payload.subject_id,
      title: payload.title,
      description: payload.description,
      file_url: payload.file_url,
      file_name: payload.file_name,
      file_type: payload.file_type,
      file_size_kb: payload.file_size_kb,
      og_title: payload.og_title,
      og_description: payload.og_description,
      og_image: payload.og_image,
    })
  }

  private validate(payload: UploadResourcePayload): void {
    if (!payload.userId || payload.userId.trim().length === 0) {
      throw new Error("User ID is required")
    }

    if (!payload.programId || payload.programId.trim().length === 0) {
      throw new Error("Program ID is required")
    }

    if (!payload.subject_id || payload.subject_id.trim().length === 0) {
      throw new Error("Subject ID is required")
    }

    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error("Resource title is required")
    }

    if (!payload.file_url || payload.file_url.trim().length === 0) {
      throw new Error("File URL is required")
    }

    if (!payload.file_name || payload.file_name.trim().length === 0) {
      throw new Error("File name is required")
    }
  }
}
