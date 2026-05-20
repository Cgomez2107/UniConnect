import type { CreateStudyResourcePayload, StudyResource } from "@/types"

export interface IResourceUploadRepository {
  validateFileSize(sizeBytes: number): boolean
  uploadFromDevice(
    userId: string,
    payload: CreateStudyResourcePayload & {
      file_name: string
      file_size_bytes: number
    }
  ): Promise<StudyResource>
}
