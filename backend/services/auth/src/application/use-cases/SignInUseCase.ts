import bcryptjs from "bcryptjs";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";
import { SignInRequest, SignInResponse } from "../dtos/index.js";
import { AuthenticationError } from "../../../../../shared/libs/errors/index.js";

export class SignInUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private tokenRepository: ITokenRepository,
    private jwtService: any
  ) {}

  async execute(request: SignInRequest): Promise<SignInResponse> {
    // Buscar usuario
    const user = await this.authRepository.findByEmail(request.email);
    if (!user) {
      throw new AuthenticationError("Credenciales inválidas.", { reason: "user_not_found" });
    }

    // Validar contraseña
    const isPasswordValid = await bcryptjs.compare(
      request.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new AuthenticationError("Credenciales inválidas.", { reason: "password_mismatch" });
    }

    // Generar tokens
    const { accessToken, refreshToken } = this.jwtService.generateTokens(user.id);

    // Guardar refresh token
    await this.tokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }
}
