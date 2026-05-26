import type { ForumAnswer } from '../entities/ForumAnswer.js';

export interface IForumAnswerRepository {
  create(data: Omit<ForumAnswer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForumAnswer>;
  findById(id: string): Promise<ForumAnswer | null>;
  findByQuestion(questionId: string): Promise<ForumAnswer[]>;
  pinAnswer(answerId: string): Promise<void>;
}
