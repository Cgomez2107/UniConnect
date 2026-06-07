import type { IForumVoteRepository } from '../../domain/repositories/IForumVoteRepository.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';
import type { VoteTargetType, VoteType } from '../../domain/entities/types.js';
import { NotFoundError } from '../../../../../shared/libs/errors/NotFoundError.js';
import { ForumSubject } from '../../domain/events/ForumSubject.js';

export interface CastVoteInput {
  targetType: VoteTargetType;
  targetId: string;
  voterId: string;
  voteType: VoteType;
}

export class CastVote {
  constructor(
    private readonly voteRepo: IForumVoteRepository,
    private readonly questionRepo: IForumQuestionRepository,
    private readonly answerRepo: IForumAnswerRepository,
    private readonly forumSubject: ForumSubject,
  ) {}

  async execute(input: CastVoteInput): Promise<{ voteCount: number; userVote: 'upvote' | 'downvote' | null; questionId?: string }> {
    const result = await this.voteRepo.upsertAndGetDelta(
      input.targetType,
      input.targetId,
      input.voterId,
      input.voteType,
    );

    const voteCount = result.voteCount;
    const userVote = result.userVote;

    let targetAuthorId: string;
    let questionId: string | undefined;

    if (input.targetType === 'question') {
      const question = await this.questionRepo.findById(input.targetId);
      if (!question) {
        throw new NotFoundError('Pregunta no encontrada.');
      }
      targetAuthorId = question.authorId;
      questionId = input.targetId;
    } else {
      const answer = await this.answerRepo.findById(input.targetId);
      if (!answer) {
        throw new NotFoundError('Respuesta no encontrada.');
      }
      targetAuthorId = answer.authorId;
      questionId = answer.questionId;
    }

    await this.forumSubject.emitVoteEvent({
      type: 'VOTO_RECIBIDO',
      version: '1.0',
      timestamp: new Date(),
      targetType: input.targetType,
      targetId: input.targetId,
      voteType: input.voteType,
      newVoteCount: voteCount,
      voterId: input.voterId,
      targetAuthorId,
      userVote,
      questionId,
    });

    return { voteCount, userVote, questionId };
  }
}
