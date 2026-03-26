import bcryptjs from "bcryptjs";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";
import { SignUpRequest, SignUpResponse } from "../dtos/index.js";

// Error classes simples para esta fase
class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class SignUpUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private tokenRepository: ITokenRepository,
    private jwtService: any // será inyectado
  ) {}

  async execute(request: SignUpRequest): Promise<SignUpResponse> {
    // Validaciones
    if (!request.email || !request.password || !request.fullName) {
      throw new ValidationError("Email, password, and fullName are required");
    }

    if (!request.email.endsWith("@ucaldas.edu.co")) {
      throw new ValidationError("Only @ucaldas.edu.co emails are allowed");
    }

    if (request.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    // Verificar que no existe
    const existing = await this.authRepository.findByEmail(request.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(request.password, 10);

    // Crear usuario
    const user = await this.authRepository.create({
      email: request.email,
      fullName: request.fullName,
      passwordHash,
      role: "estudiante",
      isActive: true,
    });

    // Generar tokens
    const { accessToken, refreshToken, accessTokenExpiry } = this.jwtService.generateTokens(user.id);

    // Guardar refresh token
    await this.tokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
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
      expiresIn: 3600, // 1 hora
    };
  }
}
