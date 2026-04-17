import type { UserSubject } from "@/types"
import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class GetMySubjects {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string): Promise<UserSubject[]> {
    return this.repository.getMySubjects(userId)
  }
}
