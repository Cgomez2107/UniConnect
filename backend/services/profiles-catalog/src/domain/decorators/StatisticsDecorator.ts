import type { IProfile } from "./IProfile.js";
import { ProfileDecorator } from "./ProfileDecorator.js";

export interface Indicators {
  readonly gruposBajoAdministracion: number;
  readonly gruposParticipa: number;
  readonly mensajesEnviados: number;
}

export class StatisticsDecorator extends ProfileDecorator {
  private readonly indicators: Indicators;

  constructor(profile: IProfile, indicators: Indicators) {
    super(profile);
    this.indicators = indicators;
  }

  getIndicators(): Indicators {
    return this.indicators;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.profile.getMetadata(),
      indicadores: this.indicators,
    };
  }

  override render(): string {
    return `${this.profile.render()} | Actividad: ${this.indicators.mensajesEnviados} msgs, ${this.indicators.gruposBajoAdministracion} grupos administrados, participa en ${this.indicators.gruposParticipa}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
