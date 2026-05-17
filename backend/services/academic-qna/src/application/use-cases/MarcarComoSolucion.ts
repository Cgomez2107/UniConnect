import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';
import { NotFoundError } from '../../../../../shared/libs/errors/NotFoundError.js';
import { AuthorizationError } from '../../../../../shared/libs/errors/AuthorizationError.js';
import { ForumSubject } from '../../domain/events/ForumSubject.js';

export interface MarcarComoSolucionInput {
  questionId: string;
  answerId: string;
  userId: string;
}

export class MarcarComoSolucion {
  constructor(
    private readonly questionRepo: IForumQuestionRepository,
    private readonly answerRepo: IForumAnswerRepository,
    private readonly forumSubject: ForumSubject,
  ) {}

  async execute(input: MarcarComoSolucionInput): Promise<void> {
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
      throw new AuthorizationError('No tienes permisos para marcar una solución en este grupo.');
    }

    await this.questionRepo.markAsSolved(input.questionId);

    await this.forumSubject.emitSolucionEvent({
      type: 'SOLUCION_MARCADA',
      version: '1.0',
      timestamp: new Date(),
      questionId: input.questionId,
      answerId: input.answerId,
      marcadoPor: input.userId,
      answerAuthorId: answer.authorId,
    });
  }
}
