import type { ForumAnswer } from '../../domain/entities/ForumAnswer.js';
import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';

export class ListAnswers {
  constructor(
    private readonly answerRepo: IForumAnswerRepository,
  ) {}

  async execute(questionId: string): Promise<ForumAnswer[]> {
    return this.answerRepo.findByQuestion(questionId);
  }
}
