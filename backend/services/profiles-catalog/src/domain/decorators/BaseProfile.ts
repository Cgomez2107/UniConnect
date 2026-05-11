import type { IProfile } from "./IProfile.js";

export class BaseProfile implements IProfile {
  readonly id: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;
  readonly carrera: string;
  readonly semestre: number | null;
  readonly asignaturasActivas: { id: string; name: string }[];

  constructor(input: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    carrera: string;
    semestre: number | null;
    asignaturasActivas: { id: string; name: string }[];
  }) {
    this.id = input.id;
    this.fullName = input.fullName;
    this.avatarUrl = input.avatarUrl;
    this.carrera = input.carrera;
    this.semestre = input.semestre;
    this.asignaturasActivas = input.asignaturasActivas;
  }

  getBaseInfo(): Record<string, unknown> {
    return {
      id: this.id,
      fullName: this.fullName,
      avatarUrl: this.avatarUrl,
      carrera: this.carrera,
      semestre: this.semestre,
      asignaturasActivas: this.asignaturasActivas,
    };
  }

  getMetadata(): Record<string, unknown> {
    return {
      id: this.id,
      fullName: this.fullName,
      avatarUrl: this.avatarUrl,
      carrera: this.carrera,
      semestre: this.semestre,
      asignaturasActivas: this.asignaturasActivas,
    };
  }

  render(): string {
    return `${this.fullName} - ${this.carrera} (Semestre ${this.semestre ?? "?"})`;
  }

  toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
