import type { IResourceCard } from "./IResourceCard.js";
import { ResourceCardDecorator } from "./ResourceCardDecorator.js";

export interface RatingData {
  readonly average: number | null;
  readonly total: number;
}

export class RatingDecorator extends ResourceCardDecorator {
  constructor(
    card: IResourceCard,
    private readonly rating: RatingData,
  ) {
    super(card);
  }

  getMetadata(): Record<string, unknown> {
    const base = super.getMetadata();
    return {
      ...base,
      rating: {
        average: this.rating.average,
        total: this.rating.total,
      },
    };
  }

  static wrap(card: IResourceCard, rating: RatingData): RatingDecorator {
    return new RatingDecorator(card, rating);
  }
}
