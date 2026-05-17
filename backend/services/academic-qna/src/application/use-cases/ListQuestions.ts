import type { QuestionSummary } from '../../domain/entities/QuestionSummary.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';

export interface ListQuestionsInput {
  subjectId: string;
  page: number;
  limit: number;
}

export class ListQuestions {
  constructor(
    private readonly questionRepo: IForumQuestionRepository,
  ) {}

  async execute(input: ListQuestionsInput): Promise<QuestionSummary[]> {
    return this.questionRepo.findSummariesBySubject(input.subjectId, input.page, input.limit);
  }
}
