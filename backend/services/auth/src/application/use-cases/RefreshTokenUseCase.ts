import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { RefreshTokenRequest, RefreshTokenResponse } from "../dtos/index.js";
import { AuthenticationError } from "../../../../../shared/libs/errors/index.js";

export class RefreshTokenUseCase {
  constructor(
    private tokenRepository: ITokenRepository,
    private authRepository: IAuthRepository,
    private jwtService: any
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // Validar token
    const stored = await this.tokenRepository.findByToken(request.refreshToken);
    if (!stored || stored.expiresAt < new Date() || stored.revokedAt) {
      throw new AuthenticationError("Refresh token inválido o expirado.", { reason: "refresh_token_invalid" });
    }

    // Verificar que el usuario existe
    const user = await this.authRepository.findById(stored.userId);
    if (!user) {
      throw new AuthenticationError("Usuario no encontrado.", { reason: "user_not_found" });
    }

    // Generar nuevo access token
    const { accessToken, refreshToken } = this.jwtService.generateTokens(user.id);

    // Guardar nuevo refresh token
    await this.tokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }
}
