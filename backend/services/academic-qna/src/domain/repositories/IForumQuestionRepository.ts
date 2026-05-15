import type { ForumQuestion } from '../entities/ForumQuestion.js';
import type { QuestionSummary } from '../entities/QuestionSummary.js';

export interface IForumQuestionRepository {
  create(data: Omit<ForumQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForumQuestion>;
  findById(id: string): Promise<ForumQuestion | null>;
  findSummariesBySubject(subjectId: string, page: number, limit: number): Promise<QuestionSummary[]>;
  findBySubject(subjectId: string, page: number, limit: number): Promise<ForumQuestion[]>;
  incrementAnswerCount(id: string): Promise<void>;
  markAsSolved(id: string): Promise<void>;
  isAdminOfStudyGroup(questionId: string, userId: string): Promise<boolean>;
}
