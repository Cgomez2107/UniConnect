import type { IAuthRepository } from "../../repositories/IAuthRepository"

export class ValidateInstitutionalAccess {
  constructor(private repository: IAuthRepository) {}

  async execute(): Promise<boolean> {
    return this.repository.validateInstitutionalAccess()
  }
}
