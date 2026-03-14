import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class AddMySubject {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string, subjectId: string): Promise<void> {
    await this.repository.addMySubject(userId, subjectId)
  }
}
