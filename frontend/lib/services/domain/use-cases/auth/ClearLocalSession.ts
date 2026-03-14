import type { IAuthRepository } from "../../repositories/IAuthRepository"

export class ClearLocalSession {
  constructor(private repository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.repository.signOutLocal()
  }
}
