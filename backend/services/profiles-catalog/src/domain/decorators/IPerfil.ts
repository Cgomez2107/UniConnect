export interface IPerfil {
  readonly id: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;

  getInformacionBase(): Record<string, unknown>;
  getMetadata(): Record<string, unknown>;
  render(): string;
  toJSON(): Record<string, unknown>;
}
