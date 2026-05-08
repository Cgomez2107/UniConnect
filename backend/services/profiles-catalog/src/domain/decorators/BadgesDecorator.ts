import type { IProfile } from "./IProfile.js";
import { ProfileDecorator } from "./ProfileDecorator.js";

export interface Badge {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly iconoUrl: string;
  readonly fechaObtenida: string;
}

export class BadgesDecorator extends ProfileDecorator {
  private readonly badges: readonly Badge[];

  constructor(profile: IProfile, badges: Badge[]) {
    super(profile);
    this.badges = Object.freeze([...badges]);
  }

  getBadges(): readonly Badge[] {
    return this.badges;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.profile.getMetadata(),
      insignias: this.badges.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        descripcion: b.descripcion,
        iconoUrl: b.iconoUrl,
        fechaObtenida: b.fechaObtenida,
      })),
    };
  }

  override render(): string {
    const base = this.profile.render();
    const count = this.badges.length;
    if (count === 0) return base;
    return `${base} | ${count} insignia${count !== 1 ? "s" : ""} desbloqueada${count !== 1 ? "s" : ""}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
