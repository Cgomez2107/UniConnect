export interface IResourceCard {
  getContent(): Record<string, unknown>;
  getMetadata(): Record<string, unknown>;
  render(): string;
  toJSON(): Record<string, unknown>;
}
