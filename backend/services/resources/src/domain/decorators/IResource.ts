export interface IResource {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly url: string;
  readonly resourceType: string | null;
  readonly uploaderUserId: string;

  getBaseInfo(): Record<string, unknown>;
  getMetadata(): Record<string, unknown>;
  render(): string;
  toJSON(): Record<string, unknown>;
}
