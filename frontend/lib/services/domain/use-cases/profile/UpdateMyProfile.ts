import type { Profile } from "@/types"
import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class UpdateMyProfile {
  constructor(private repository: IProfileRepository) {}

  async execute(
    userId: string,
    updates: {
      bio?: string
      phone_number?: string | null
    }
  ): Promise<Profile> {
    return this.repository.updateProfile(userId, updates)
  }
}
