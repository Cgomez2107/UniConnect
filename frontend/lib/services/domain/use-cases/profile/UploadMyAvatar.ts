import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class UploadMyAvatar {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string, imageUri: string): Promise<string> {
    return this.repository.uploadAvatar(userId, imageUri)
  }
}
