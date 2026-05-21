import type { IForumRepository } from "../../repositories/IForumRepository";
import type { ForumQuestion, ForumAnswer } from "@/types";

export class GetForumQuestionDetail {
  constructor(private forumRepo: IForumRepository) {}

  async execute(id: string): Promise<{ question: ForumQuestion; answers: ForumAnswer[] }> {
    return this.forumRepo.getQuestionDetail(id);
  }
}
