import type { IResourceCard } from "./IResourceCard.js";
import { ResourceCardDecorator } from "./ResourceCardDecorator.js";

export interface CommentSummary {
  readonly id: string;
  readonly author: string;
  readonly content: string;
  readonly createdAt: string;
}

export class CommentsDecorator extends ResourceCardDecorator {
  constructor(
    card: IResourceCard,
    private readonly comments: CommentSummary[],
  ) {
    super(card);
  }

  getMetadata(): Record<string, unknown> {
    const base = super.getMetadata();
    return {
      ...base,
      comments: this.comments,
    };
  }

  static wrap(card: IResourceCard, comments: CommentSummary[]): CommentsDecorator {
    return new CommentsDecorator(card, comments);
  }
}
