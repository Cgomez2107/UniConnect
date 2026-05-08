import type { IPerfil } from "./IPerfil.js";
import { PerfilDecorator } from "./PerfilDecorator.js";

export interface Insignia {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly iconoUrl: string;
  readonly fechaObtenida: string;
}

export class InsigniasDecorator extends PerfilDecorator {
  private readonly insignias: readonly Insignia[];

  constructor(perfil: IPerfil, insignias: Insignia[]) {
    super(perfil);
    this.insignias = Object.freeze([...insignias]);
  }

  getInsignias(): readonly Insignia[] {
    return this.insignias;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.perfil.getMetadata(),
      insignias: this.insignias.map((i) => ({
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion,
        iconoUrl: i.iconoUrl,
        fechaObtenida: i.fechaObtenida,
      })),
    };
  }

  override render(): string {
    const base = this.perfil.render();
    const count = this.insignias.length;
    if (count === 0) return base;
    return `${base} | ${count} insignia${count !== 1 ? "s" : ""} desbloqueada${count !== 1 ? "s" : ""}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
