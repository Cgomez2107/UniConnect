import type { ForumQuestion, ForumQuestionSummary, ForumAnswer, ForumVotePayload } from "@/types";

export interface IForumRepository {
  createQuestion(subjectId: string, title: string, body: string): Promise<ForumQuestion>;
  listQuestions(subjectId: string, page?: number, limit?: number): Promise<ForumQuestionSummary[]>;
  getQuestionDetail(id: string): Promise<{ question: ForumQuestion; answers: ForumAnswer[] }>;
  createAnswer(questionId: string, body: string): Promise<ForumAnswer>;
  listAnswers(questionId: string): Promise<ForumAnswer[]>;
  castVote(payload: ForumVotePayload): Promise<{ voteCount: number }>;
  markAsSolution(questionId: string, answerId: string): Promise<void>;
  pinAnswer(questionId: string, answerId: string): Promise<void>;
}
