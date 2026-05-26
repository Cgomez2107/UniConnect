import type { ForumQuestion } from '../../domain/entities/ForumQuestion.js';
import type { ForumAnswer } from '../../domain/entities/ForumAnswer.js';
import type { IForumQuestionRepository } from '../../domain/repositories/IForumQuestionRepository.js';
import type { IForumAnswerRepository } from '../../domain/repositories/IForumAnswerRepository.js';
import type { IForumVoteRepository } from '../../domain/repositories/IForumVoteRepository.js';
import { NotFoundError } from '../../../../../shared/libs/errors/NotFoundError.js';

export interface QuestionDetail {
  question: ForumQuestion & { userVote?: string | null };
  answers: (ForumAnswer & { userVote?: string | null })[];
}

export class GetQuestionDetail {
  constructor(
    private readonly questionRepo: IForumQuestionRepository,
    private readonly answerRepo: IForumAnswerRepository,
    private readonly voteRepo: IForumVoteRepository,
  ) {}

  async execute(id: string, userId: string): Promise<QuestionDetail> {
    const question = await this.questionRepo.findById(id);

    if (!question) {
      throw new NotFoundError('Pregunta no encontrada.');
    }

    const answers = await this.answerRepo.findByQuestion(id);

    const targets: Array<{ targetType: 'question' | 'answer'; targetId: string }> = [
      { targetType: 'question', targetId: question.id },
      ...answers.map(a => ({ targetType: 'answer' as const, targetId: a.id })),
    ];

    const userVotes = await this.voteRepo.getUserVotes(userId, targets);

    return {
      question: { ...question, userVote: userVotes.get(question.id) ?? null },
      answers: answers.map(a => ({ ...a, userVote: userVotes.get(a.id) ?? null })),
    };
  }
}
