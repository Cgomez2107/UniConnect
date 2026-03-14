import type { IAuthRepository } from "../../repositories/IAuthRepository"

export class GetCurrentSession {
  constructor(private repository: IAuthRepository) {}

  async execute() {
    return this.repository.getSession()
  }
}
