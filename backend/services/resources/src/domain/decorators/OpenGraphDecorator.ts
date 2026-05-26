import type { IResourceCard } from "./IResourceCard.js";
import { ResourceCardDecorator } from "./ResourceCardDecorator.js";

export class OpenGraphDecorator extends ResourceCardDecorator {
  constructor(
    card: IResourceCard,
    private readonly ogData: {
      ogTitle: string | null;
      ogDescription: string | null;
      ogImage: string | null;
    },
  ) {
    super(card);
  }

  getMetadata(): Record<string, unknown> {
    const base = super.getMetadata();
    return {
      ...base,
      ogTitle: this.ogData.ogTitle,
      ogDescription: this.ogData.ogDescription,
      ogImage: this.ogData.ogImage,
    };
  }

  static wrap(
    card: IResourceCard,
    ogData: {
      ogTitle: string | null;
      ogDescription: string | null;
      ogImage: string | null;
    },
  ): OpenGraphDecorator {
    return new OpenGraphDecorator(card, ogData);
  }
}
