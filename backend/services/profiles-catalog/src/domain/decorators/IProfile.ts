export interface IProfile {
  readonly id: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;

  getBaseInfo(): Record<string, unknown>;
  getMetadata(): Record<string, unknown>;
  render(): string;
  toJSON(): Record<string, unknown>;
}
