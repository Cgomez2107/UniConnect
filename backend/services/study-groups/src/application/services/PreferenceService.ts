import type { IPreferenceService } from "../../../../../shared/patterns/strategy/IPreferenceService.js";
import type { IPreferenceRepository } from "../../../../../shared/patterns/strategy/IPreferenceRepository.js";

const ALL_CHANNELS: readonly string[] = [
  "in_app_websocket",
  "email_institucional",
  "push_movil",
];

export class PreferenceService implements IPreferenceService {
  constructor(private readonly repository: IPreferenceRepository) {}

  async getCanalesActivos(userId: string, eventType: string): Promise<string[]> {
    const canales = await this.repository.getCanalesActivos(userId, eventType);

    if (canales === null) {
      return [...ALL_CHANNELS];
    }

    return canales;
  }

  async setCanalActivo(userId: string, eventType: string, canal: string, activo: boolean): Promise<void> {
    await this.repository.setCanalActivo(userId, eventType, canal, activo);
  }
}
