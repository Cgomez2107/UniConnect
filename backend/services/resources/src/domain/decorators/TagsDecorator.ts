import type { IResourceCard } from "./IResourceCard.js";
import { ResourceCardDecorator } from "./ResourceCardDecorator.js";

export class TagsDecorator extends ResourceCardDecorator {
  constructor(
    card: IResourceCard,
    private readonly tags: string[],
  ) {
    super(card);
  }

  getMetadata(): Record<string, unknown> {
    const base = super.getMetadata();
    return {
      ...base,
      tags: this.tags,
    };
  }

  static wrap(card: IResourceCard, tags: string[]): TagsDecorator {
    return new TagsDecorator(card, tags);
  }
}
