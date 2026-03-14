import type { CreateStudyResourcePayload, StudyResource } from "@/types"
import type { IResourceUploadRepository } from "../../repositories/IResourceUploadRepository"

export class UploadResourceFromDevice {
  constructor(private repository: IResourceUploadRepository) {}

  validateFileFormat(fileName: string): boolean {
    return this.repository.validateFileFormat(fileName)
  }

  validateFileSize(sizeBytes: number): boolean {
    return this.repository.validateFileSize(sizeBytes)
  }

  async execute(
    userId: string,
    payload: CreateStudyResourcePayload & {
      file_name: string
      file_size_bytes: number
    }
  ): Promise<StudyResource> {
    return this.repository.uploadFromDevice(userId, payload)
  }
}
