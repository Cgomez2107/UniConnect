import type { IAuthRepository, SignUpInput, SignUpResult } from "../../repositories/IAuthRepository"
import { ValidationError } from "../../errors"

function isUcaldasEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@ucaldas.edu.co")
}

export class SignUpWithPassword {
  constructor(private repository: IAuthRepository) {}

  async execute(input: SignUpInput): Promise<SignUpResult> {
    if (!isUcaldasEmail(input.email)) {
      throw new ValidationError("email", "Solo se permiten correos institucionales @ucaldas.edu.co")
    }

    return this.repository.signUp(input)
  }
}
