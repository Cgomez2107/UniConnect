import type { ForumAnswer } from '../../domain/entities/ForumAnswer.js';
import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import type { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository.js';
import { ForumQuestionCoRFactory } from '../validation/ForumQuestionCoRFactory.js';
import { NotFoundError } from '../../../../../shared/libs/errors/NotFoundError.js';

export interface CreateAnswerInput {
  questionId: string;
  userId: string;
  body: string;
}

export class CreateAnswer {
  constructor(
    private readonly answerRepo: IForumAnswerRepository,
    private readonly questionRepo: IForumQuestionRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(input: CreateAnswerInput): Promise<ForumAnswer> {
    const question = await this.questionRepo.findById(input.questionId);

    if (!question) {
      throw new NotFoundError('Pregunta no encontrada.');
    }

    if (question.status !== 'active') {
      throw new NotFoundError('La pregunta no está activa.');
    }

    const chain = ForumQuestionCoRFactory.createPublicationChain();

    await chain.validate({
      userId: input.userId,
      subjectId: question.subjectId,
      body: input.body,
      enrollmentRepo: this.enrollmentRepo,
    });

    const answer = await this.answerRepo.create({
      questionId: input.questionId,
      authorId: input.userId,
      authorName: '',
      body: input.body,
      voteCount: 0,
      isPinned: false,
    });

    await this.questionRepo.incrementAnswerCount(input.questionId);

    return answer;
  }
}
