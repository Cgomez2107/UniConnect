import type { UserProgram } from "@/types"
import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class GetMyPrograms {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string): Promise<UserProgram[]> {
    return this.repository.getMyPrograms(userId)
  }
}
