import type { IProfileRepository } from "../../repositories/IProfileRepository"

export class SetPrimaryProgram {
  constructor(private repository: IProfileRepository) {}

  async execute(userId: string, programId: string): Promise<void> {
    await this.repository.setPrimaryProgram(userId, programId)
  }
}
