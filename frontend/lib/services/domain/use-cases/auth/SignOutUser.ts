import type { IAuthRepository } from "../../repositories/IAuthRepository"

export class SignOutUser {
  constructor(private repository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.repository.signOut()
  }
}
