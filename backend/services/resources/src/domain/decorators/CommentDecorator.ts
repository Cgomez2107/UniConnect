import type { IResource } from "./IResource.js";
import { ResourceDecorator } from "./ResourceDecorator.js";

export interface Comment {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly content: string;
  readonly createdAt: string;
}

export class CommentDecorator extends ResourceDecorator {
  private readonly comments: readonly Comment[];
  private readonly totalCount: number;

  constructor(resource: IResource, comments: Comment[], totalCount?: number) {
    super(resource);
    this.comments = Object.freeze([...comments]);
    this.totalCount = totalCount ?? comments.length;
  }

  getComments(): readonly Comment[] {
    return this.comments;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...this.resource.getMetadata(),
      comments: this.comments.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.userName,
        content: c.content,
        createdAt: c.createdAt,
      })),
      totalComments: this.totalCount,
    };
  }

  override render(): string {
    const base = this.resource.render();
    const count = this.totalCount;
    if (count === 0) return `${base} | Sin comentarios`;
    return `${base} | ${count} comentario${count !== 1 ? "s" : ""}`;
  }

  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
