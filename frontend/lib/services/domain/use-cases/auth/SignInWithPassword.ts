import type { IAuthRepository, SignInInput, SignInResult } from "../../repositories/IAuthRepository"

export class SignInWithPassword {
  constructor(private repository: IAuthRepository) {}

  async execute(input: SignInInput): Promise<SignInResult> {
    return this.repository.signIn(input)
  }
}
