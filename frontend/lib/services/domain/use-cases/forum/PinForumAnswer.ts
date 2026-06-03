import type { IForumRepository } from "../../repositories/IForumRepository";

export class PinForumAnswer {
  constructor(private forumRepo: IForumRepository) {}

  async execute(questionId: string, answerId: string): Promise<void> {
    return this.forumRepo.pinAnswer(questionId, answerId);
  }
}
