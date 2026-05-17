import bcryptjs from "bcryptjs";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";
import { SignUpRequest, SignUpResponse } from "../dtos/index.js";
import { ConflictError, ValidationError } from "../../../../../shared/libs/errors/index.js";

export class SignUpUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private tokenRepository: ITokenRepository,
    private jwtService: any,
    private onUserCreated?: (userId: string, fullName: string) => Promise<void>,
    private supabaseUrl?: string,
    private supabaseServiceRoleKey?: string,
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

    // Verificar que no existe localmente
    const existing = await this.authRepository.findByEmail(request.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    // Crear usuario en Supabase Auth vía Admin API
    let supabaseUserId: string;
    if (this.supabaseUrl && this.supabaseServiceRoleKey) {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
          email_confirm: true,
          user_metadata: { full_name: request.fullName },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ msg: "Unknown error" }));
        if (response.status === 409) {
          throw new ConflictError("Email already registered");
        }
        throw new Error(`Failed to create user in Supabase Auth: ${err.msg ?? "Unknown error"}`);
      }

      const supabaseUser = await response.json() as { id: string };
      supabaseUserId = supabaseUser.id;
    } else {
      // Sin Supabase Admin API, generar ID local
      throw new Error("Supabase Admin API is not configured");
    }

    // Hash password para almacenamiento local
    const passwordHash = await bcryptjs.hash(request.password, 10);

    // Crear usuario en repositorio local con el ID de Supabase
    const user = await this.authRepository.create({
      id: supabaseUserId,
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

    // Crear perfil en profiles-catalog
    if (this.onUserCreated) {
      await this.onUserCreated(user.id, user.fullName);
    }

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
