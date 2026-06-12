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
    private onUserCreated?: (userId: string, fullName: string, email: string) => Promise<void>,
    private supabaseUrl?: string,
    private supabaseServiceRoleKey?: string,
  ) {}

  async execute(request: SignUpRequest): Promise<SignUpResponse> {
    if (!request.email || !request.password || !request.fullName) {
      throw new ValidationError("Email, password, and fullName are required");
    }

    if (!request.email.endsWith("@ucaldas.edu.co")) {
      throw new ValidationError("Only @ucaldas.edu.co emails are allowed");
    }

    if (request.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    const existing = await this.authRepository.findByEmail(request.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    // Crear usuario en Supabase Auth vía Admin API con email_confirm: false
    // para que el usuario deba verificar su correo antes de recibir el welcome
    let supabaseUserId: string = crypto.randomUUID();
    if (this.supabaseUrl && this.supabaseServiceRoleKey) {
      try {
        const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({
            email: request.email,
            password: request.password,
            email_confirm: false,
            user_metadata: { full_name: request.fullName },
          }),
        });

        if (response.ok) {
          const supabaseUser = await response.json() as { id: string };
          supabaseUserId = supabaseUser.id;
        } else {
          const err = await response.json().catch(() => ({ msg: "Unknown error" }));
          if (response.status === 409) {
            throw new ConflictError("Email already registered");
          }
          console.warn(`Supabase Auth creation failed (${response.status}): ${err.msg ?? "Unknown error"}. Proceeding with local user.`);
        }
      } catch (err) {
        if (err instanceof ConflictError) throw err;
        console.warn(`Supabase Auth creation failed: ${err}. Proceeding with local user.`);
      }
    }

    const passwordHash = await bcryptjs.hash(request.password, 10);

    const user = await this.authRepository.create({
      id: supabaseUserId,
      email: request.email,
      fullName: request.fullName,
      passwordHash,
      role: "estudiante",
      isActive: true,
      isVerified: false,
    });

    const { accessToken, refreshToken, accessTokenExpiry } = this.jwtService.generateTokens(user.id, user.role);

    await this.tokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Generar token de verificación de email
    const verificationToken = this.jwtService.generateVerificationToken(user.id, user.email);

    // Crear perfil en profiles-catalog (sin emitir webhook aún)
    if (this.onUserCreated) {
      await this.onUserCreated(user.id, user.fullName, user.email);
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
      expiresIn: 3600,
      verificationToken,
    };
  }
}
