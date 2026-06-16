import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { AuthenticationError, ValidationError } from "../../../../../shared/libs/errors/index.js";

export type WebhookDispatcher = (email: string, fullName: string, userId: string) => void;

export class VerifyEmailUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private jwtService: { verifyVerificationToken: (token: string) => { sub: string; email: string } | null },
    private dispatchWelcomeWebhook: WebhookDispatcher,
    private supabaseUrl?: string,
    private supabaseServiceRoleKey?: string,
  ) {}

  async execute(token: string): Promise<{ id: string; email: string; fullName: string; verified: boolean }> {
    if (!token) {
      throw new ValidationError("Verification token is required");
    }

    // Verificar el token JWT
    const payload = this.jwtService.verifyVerificationToken(token);
    if (!payload) {
      throw new ValidationError("Invalid or expired verification token");
    }

    const { sub: userId, email } = payload;

    // Buscar usuario
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (user.isVerified) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        verified: true,
      };
    }

    // Confirmar email en Supabase Auth Admin API
    if (this.supabaseUrl && this.supabaseServiceRoleKey) {
      try {
        const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({
            email_confirm: true,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ msg: "Unknown error" }));
          console.warn(`Supabase Auth email confirm failed (${response.status}): ${err.msg}. Continuing with local update.`);
        }
      } catch (err) {
        console.warn(`Supabase Auth email confirm error: ${err}. Continuing with local update.`);
      }
    }

    // Actualizar isVerified en BD local
    await this.authRepository.update(userId, { isVerified: true });

    // Emitir evento 'usuario.verificado' vía webhook a n8n
    this.dispatchWelcomeWebhook(email, user.fullName, userId);

    return {
      id: userId,
      email,
      fullName: user.fullName,
      verified: true,
    };
  }
}
