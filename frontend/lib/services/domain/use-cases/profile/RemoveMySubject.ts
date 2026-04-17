import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class RemoveMySubject {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string, subjectId: string): Promise<void> {
    await this.repository.removeMySubject(userId, subjectId)
  }
}
