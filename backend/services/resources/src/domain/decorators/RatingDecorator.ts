import type { IResource } from "./IResource.js";
import { ResourceDecorator } from "./ResourceDecorator.js";

export interface RatingData {
  readonly average: number;
  readonly count: number;
  readonly userRating?: number;
}

export class RatingDecorator extends ResourceDecorator {
  private readonly rating: RatingData;

  constructor(resource: IResource, rating: RatingData) {
    super(resource);
    this.rating = rating;
  }

  getRating(): RatingData {
    return this.rating;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.resource.getMetadata(),
      rating: {
        average: this.rating.average,
        count: this.rating.count,
        userRating: this.rating.userRating,
      },
    };
  }

  override render(): string {
    const base = this.resource.render();
    if (this.rating.count === 0) return `${base} | Sin valoraciones`;
    return `${base} | ${this.rating.average.toFixed(1)} ⭐ (${this.rating.count} valoraciones)`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
