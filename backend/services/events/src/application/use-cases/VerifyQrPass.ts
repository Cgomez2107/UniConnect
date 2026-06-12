import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import { QrPass } from "../../domain/value-objects/QrPass.js";

export interface VerificationResult {
  valid: boolean;
  user?: {
    fullName: string;
    avatarUrl: string | null;
  };
  reason?: string;
  scannedAt?: string | null;
}

export class VerifyQrPass {
  constructor(
    private readonly repository: IEventRepository,
    private readonly qrSecret: string,
  ) {}

  async execute(qrData: string, organizerId: string): Promise<VerificationResult> {
    const parsed = QrPass.parse(qrData);
    if (!parsed) {
      return { valid: false, reason: "Formato de QR inválido" };
    }

    const { token, signature } = parsed;

    const valid = QrPass.verify(token, signature, this.qrSecret);
    if (!valid) {
      return { valid: false, reason: "Firma digital corrupta" };
    }

    const registration = await this.repository.getRegistrationByQrToken(token);
    if (!registration) {
      return { valid: false, reason: "Registro no encontrado" };
    }

    if (registration.isUsed) {
      return {
        valid: false,
        reason: "Ya verificado",
        scannedAt: registration.scannedAt,
      };
    }

    const event = await this.repository.getEventByRegistration(registration.id);
    if (!event) {
      return { valid: false, reason: "Evento no encontrado" };
    }

    if (event.status === "cancelled") {
      return { valid: false, reason: "Evento cancelado" };
    }

    const userProfile = await this.repository.getUserProfile(registration.userId);
    if (!userProfile) {
      return { valid: false, reason: "Usuario no encontrado" };
    }

    await this.repository.markQrAsUsed(registration.id, organizerId);

    return {
      valid: true,
      user: {
        fullName: userProfile.fullName,
        avatarUrl: userProfile.avatarUrl,
      },
      scannedAt: null,
    };
  }
}
