import type { IForumRepository } from "../../repositories/IForumRepository";

export class MarkForumSolution {
  constructor(private forumRepo: IForumRepository) {}

  async execute(questionId: string, answerId: string): Promise<void> {
    return this.forumRepo.markAsSolution(questionId, answerId);
  }
}
