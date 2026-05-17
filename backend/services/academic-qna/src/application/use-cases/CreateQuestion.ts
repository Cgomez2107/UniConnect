import type { ForumQuestion } from '../../domain/entities/ForumQuestion.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import type { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository.js';
import { ForumValidatorFactory } from '../validation/ForumValidatorFactory.js';

export interface CreateQuestionInput {
  userId: string;
  subjectId: string;
  title: string;
  body: string;
}

export class CreateQuestion {
  constructor(
    private readonly questionRepo: IForumQuestionRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(input: CreateQuestionInput): Promise<ForumQuestion> {
    const chain = ForumValidatorFactory.createPublicationChain();

    await chain.validate({
      userId: input.userId,
      subjectId: input.subjectId,
      title: input.title,
      body: input.body,
      enrollmentRepo: this.enrollmentRepo,
    });

    return this.questionRepo.create({
      subjectId: input.subjectId,
      authorId: input.userId,
      title: input.title,
      body: input.body,
      status: 'active',
      answerCount: 0,
      voteCount: 0,
    });
  }
}
