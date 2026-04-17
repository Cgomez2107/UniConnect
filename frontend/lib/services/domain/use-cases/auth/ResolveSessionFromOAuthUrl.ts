import type {
  IAuthRepository,
  OAuthSessionResolutionMode,
} from "../../repositories/IAuthRepository"

export class ResolveSessionFromOAuthUrl {
  constructor(private repository: IAuthRepository) {}

  async execute(url: string): Promise<OAuthSessionResolutionMode> {
    return this.repository.resolveSessionFromOAuthUrl(url)
  }
}
