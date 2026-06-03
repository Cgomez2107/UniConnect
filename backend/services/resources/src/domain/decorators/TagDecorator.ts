import type { IResource } from "./IResource.js";
import { ResourceDecorator } from "./ResourceDecorator.js";

export interface Tag {
  readonly id: string;
  readonly name: string;
}

export class TagDecorator extends ResourceDecorator {
  private readonly tags: readonly Tag[];

  constructor(resource: IResource, tags: Tag[]) {
    super(resource);
    this.tags = Object.freeze([...tags]);
  }

  getTags(): readonly Tag[] {
    return this.tags;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.resource.getMetadata(),
      tags: this.tags.map((t) => ({
        id: t.id,
        name: t.name,
      })),
    };
  }

  override render(): string {
    const base = this.resource.render();
    const count = this.tags.length;
    if (count === 0) return base;
    return `${base} | Etiquetas: ${this.tags.map((t) => t.name).join(", ")}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
