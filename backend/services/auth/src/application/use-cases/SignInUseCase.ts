import bcryptjs from "bcryptjs";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";
import { SignInRequest, SignInResponse } from "../dtos/index.js";
import { AuthenticationError, ValidationError } from "../../../../../shared/libs/errors/index.js";

export class SignInUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private tokenRepository: ITokenRepository,
    private jwtService: any,
    private supabaseUrl?: string,
    private supabaseServiceRoleKey?: string,
  ) {}

  async execute(request: SignInRequest): Promise<SignInResponse> {
    if (!request.email.endsWith("@ucaldas.edu.co")) {
      throw new ValidationError("Solo se permite inicio de sesión con correo institucional @ucaldas.edu.co");
    }

    // 1. Buscar usuario en nuestra BD local (auth_users)
    const user = await this.authRepository.findByEmail(request.email);
    if (user) {
      return this.handleLocalSignIn(user, request.password);
    }

    // 2. Fallback: intentar con Supabase Auth (usuarios creados via móvil/dashboard)
    return this.handleSupabaseFallback(request.email, request.password);
  }

  private async handleLocalSignIn(
    user: { id: string; email: string; fullName: string; passwordHash: string; role: string; isActive: boolean },
    password: string,
  ): Promise<SignInResponse> {
    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError("Credenciales inválidas.", { reason: "password_mismatch" });
    }

    return this.generateAuthResponse(user.id, user.email, user.fullName, user.role);
  }

  private async handleSupabaseFallback(
    email: string,
    password: string,
  ): Promise<SignInResponse> {
    if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
      throw new AuthenticationError("Credenciales inválidas.", { reason: "user_not_found" });
    }

    // 2a. Autenticar contra Supabase Auth
    const supabaseUser = await this.verifyWithSupabaseAuth(email, password);
    if (!supabaseUser) {
      throw new AuthenticationError("Credenciales inválidas.", { reason: "supabase_auth_failed" });
    }

    // 2b. Obtener rol desde la tabla profiles (donde la app móvil lo almacena)
    const role = await this.fetchRoleFromProfiles(supabaseUser.id) ?? "estudiante";
    const fullName = supabaseUser.user_metadata?.full_name ?? email.split("@")[0];

    // 2c. Intentar crear en auth_users para futuros logins (no crítico si falla)
    try {
      const exists = await this.authRepository.findByEmail(email);
      if (!exists) {
        await this.authRepository.create({
          id: supabaseUser.id,
          email,
          fullName,
          passwordHash: "",
          role: role as "estudiante" | "moderador" | "admin",
          isActive: true,
        });
      }
    } catch {
      // Si falla (ej. trigger DB roto), el login sigue funcionando via Supabase
    }

    return this.generateAuthResponse(supabaseUser.id, email, fullName, role);
  }

  private async generateAuthResponse(
    userId: string,
    email: string,
    fullName: string,
    role: string,
  ): Promise<SignInResponse> {
    const { accessToken, refreshToken } = this.jwtService.generateTokens(userId);

    await this.tokenRepository.create({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: { id: userId, email, fullName, role },
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  private async verifyWithSupabaseAuth(
    email: string,
    password: string,
  ): Promise<{ id: string; user_metadata?: { full_name?: string } } | null> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: this.supabaseServiceRoleKey!,
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data?.user ?? null;
    } catch {
      return null;
    }
  }

  private async fetchRoleFromProfiles(userId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`,
        {
          headers: {
            apikey: this.supabaseServiceRoleKey!,
            Authorization: `Bearer ${this.supabaseServiceRoleKey!}`,
          },
        },
      );

      if (!response.ok) return null;
      const rows = await response.json() as Array<{ role: string }>;
      return rows?.[0]?.role ?? null;
    } catch {
      return null;
    }
  }
}
