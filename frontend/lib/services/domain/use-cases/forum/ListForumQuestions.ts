import type { IForumRepository } from "../../repositories/IForumRepository";
import type { ForumQuestionSummary } from "@/types";

export class ListForumQuestions {
  constructor(private forumRepo: IForumRepository) {}

  async execute(subjectId: string, page = 1, limit = 20): Promise<ForumQuestionSummary[]> {
    return this.forumRepo.listQuestions(subjectId, page, limit);
  }
}
