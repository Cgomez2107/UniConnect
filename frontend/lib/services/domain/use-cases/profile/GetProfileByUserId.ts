import type { Profile } from "@/types"
import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class GetProfileByUserId {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string): Promise<Profile | null> {
    return this.repository.getProfile(userId)
  }
}
