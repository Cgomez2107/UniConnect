import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import { QrPass } from "../../domain/value-objects/QrPass.js";

export class GenerateQrPass {
  constructor(
    private readonly repository: IEventRepository,
    private readonly qrSecret: string,
  ) {}

  async execute(eventId: string, userId: string): Promise<QrPass> {
    const registration = await this.repository.getRegistration(eventId, userId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    const token = registration.qrToken ?? registration.id;
    const signature = QrPass.sign(token, this.qrSecret);

    await this.repository.setQrData(registration.id, token, signature);

    return new QrPass(registration.id, token, signature);
  }
}
