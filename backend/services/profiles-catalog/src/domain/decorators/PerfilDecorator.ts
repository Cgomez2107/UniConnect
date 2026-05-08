import type { IPerfil } from "./IPerfil.js";

export abstract class PerfilDecorator implements IPerfil {
  protected readonly perfil: IPerfil;

  constructor(perfil: IPerfil) {
    this.perfil = perfil;
  }

  get id(): string {
    return this.perfil.id;
  }

  get fullName(): string {
    return this.perfil.fullName;
  }

  get avatarUrl(): string | null {
    return this.perfil.avatarUrl;
  }

  getInformacionBase(): Record<string, unknown> {
    return this.perfil.getInformacionBase();
  }

  getMetadata(): Record<string, unknown> {
    return this.perfil.getMetadata();
  }

  render(): string {
    return this.perfil.render();
  }

  toJSON(): Record<string, unknown> {
    return this.perfil.toJSON();
  }
}
