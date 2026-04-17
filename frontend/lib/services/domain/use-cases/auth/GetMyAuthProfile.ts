import type { AuthProfile, IAuthRepository } from "../../repositories/IAuthRepository"

export class GetMyAuthProfile {
  constructor(private repository: IAuthRepository) {}

  async execute(): Promise<AuthProfile | null> {
    return this.repository.getMyProfile()
  }
}
