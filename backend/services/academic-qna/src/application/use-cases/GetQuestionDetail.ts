import type { ForumQuestion } from '../../domain/entities/ForumQuestion.js';
import type { ForumAnswer } from '../../domain/entities/ForumAnswer.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';
import { NotFoundError } from '../../../../../shared/libs/errors/NotFoundError.js';

export interface QuestionDetail {
  question: ForumQuestion;
  answers: ForumAnswer[];
}

export class GetQuestionDetail {
  constructor(
    private readonly questionRepo: IForumQuestionRepository,
    private readonly answerRepo: IForumAnswerRepository,
  ) {}

  async execute(id: string): Promise<QuestionDetail> {
    const question = await this.questionRepo.findById(id);

    if (!question) {
      throw new NotFoundError('Pregunta no encontrada.');
    }

    const answers = await this.answerRepo.findByQuestion(id);

    return { question, answers };
  }
}
