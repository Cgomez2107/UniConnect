import type { IPerfil } from "./IPerfil.js";
import { PerfilDecorator } from "./PerfilDecorator.js";

export interface Indicadores {
  readonly gruposCreados: number;
  readonly gruposParticipa: number;
  readonly mensajesEnviados: number;
}

export class EstadisticasDecorator extends PerfilDecorator {
  private readonly indicadores: Indicadores;

  constructor(perfil: IPerfil, indicadores: Indicadores) {
    super(perfil);
    this.indicadores = indicadores;
  }

  getIndicadores(): Indicadores {
    return this.indicadores;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.perfil.getMetadata(),
      indicadores: this.indicadores,
    };
  }

  override render(): string {
    return `${this.perfil.render()} | Actividad: ${this.indicadores.mensajesEnviados} msgs, ${this.indicadores.gruposCreados} grupos creados, participa en ${this.indicadores.gruposParticipa}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
