import type {
  IAuthRepository,
  OAuthSignInUrlInput,
} from "../../repositories/IAuthRepository"

export class GetOAuthSignInUrl {
  constructor(private repository: IAuthRepository) {}

  async execute(input: OAuthSignInUrlInput): Promise<string> {
    return this.repository.getOAuthSignInUrl(input)
  }
}
