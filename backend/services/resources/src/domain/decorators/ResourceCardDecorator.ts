import type { IResourceCard } from "./IResourceCard.js";

export abstract class ResourceCardDecorator implements IResourceCard {
  protected readonly card: IResourceCard;

  constructor(card: IResourceCard) {
    this.card = card;
  }

  getContent(): Record<string, unknown> {
    return this.card.getContent();
  }

  getMetadata(): Record<string, unknown> {
    return this.card.getMetadata();
  }

  render(): string {
    return JSON.stringify({ ...this.getContent(), ...this.getMetadata() });
  }

  toJSON(): Record<string, unknown> {
    return { ...this.getContent(), ...this.getMetadata() };
  }
}
