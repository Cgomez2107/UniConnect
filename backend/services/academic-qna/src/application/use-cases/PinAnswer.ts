import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import { NotFoundError } from '../../../../../shared/libs/errors/NotFoundError.js';
import { AuthorizationError } from '../../../../../shared/libs/errors/AuthorizationError.js';

export interface PinAnswerInput {
  questionId: string;
  answerId: string;
  userId: string;
}

export class PinAnswer {
  constructor(
    private readonly questionRepo: IForumQuestionRepository,
    private readonly answerRepo: IForumAnswerRepository,
  ) {}

  async execute(input: PinAnswerInput): Promise<void> {
    const question = await this.questionRepo.findById(input.questionId);
    if (!question) {
      throw new NotFoundError('Pregunta no encontrada.');
    }

    const answer = await this.answerRepo.findById(input.answerId);
    if (!answer) {
      throw new NotFoundError('Respuesta no encontrada.');
    }

    const isAdmin = await this.questionRepo.isAdminOfStudyGroup(input.questionId, input.userId);
    if (!isAdmin) {
      throw new AuthorizationError('Solo un docente puede fijar una respuesta.');
    }

    await this.answerRepo.pinAnswer(input.answerId);
  }
}