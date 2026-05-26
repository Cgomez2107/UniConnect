import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";

export interface ForumQuestion {
  id: string;
  subjectId: string;
  authorId: string;
  title: string;
  body: string;
  status: "active" | "solved";
  answerCount: number;
  voteCount: number;
  userVote?: "upvote" | "downvote" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForumQuestionSummary {
  id: string;
  subjectId: string;
  authorId: string;
  title: string;
  status: "active" | "solved";
  answerCount: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  body: string;
  voteCount: number;
  isSolution: boolean;
  isPinned: boolean;
  userVote?: "upvote" | "downvote" | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  subjectId: string;
  title: string;
  body: string;
}

export interface CreateAnswerPayload {
  body: string;
}

export interface CastVotePayload {
  targetType: "question" | "answer";
  targetId: string;
  voteType: "upvote" | "downvote";
}

export interface MarkSolutionPayload {
  answerId: string;
}

export class ForumClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async createQuestion(data: CreateQuestionPayload): Promise<ForumQuestion> {
    const response = await this.transport.request<ForumQuestion>({
      method: "POST",
      url: "/forum/questions",
      body: data,
    });
    return response.data;
  }

  async listQuestions(subjectId: string, page = 1, limit = 20): Promise<ForumQuestionSummary[]> {
    const response = await this.transport.request<ForumQuestionSummary[]>({
      method: "GET",
      url: "/forum/questions",
      params: { subjectId, page: String(page), limit: String(limit) },
    });
    return response.data;
  }

  async getQuestionDetail(id: string): Promise<{ question: ForumQuestion; answers: ForumAnswer[] }> {
    const response = await this.transport.request<{ question: ForumQuestion; answers: ForumAnswer[] }>({
      method: "GET",
      url: `/forum/questions/${id}`,
    });
    return response.data;
  }

  async createAnswer(questionId: string, data: CreateAnswerPayload): Promise<ForumAnswer> {
    const response = await this.transport.request<ForumAnswer>({
      method: "POST",
      url: `/forum/questions/${questionId}/answers`,
      body: data,
    });
    return response.data;
  }

  async listAnswers(questionId: string): Promise<ForumAnswer[]> {
    const response = await this.transport.request<ForumAnswer[]>({
      method: "GET",
      url: `/forum/questions/${questionId}/answers`,
    });
    return this.ensureArray(response.data);
  }

  async castVote(data: CastVotePayload): Promise<{ voteCount: number }> {
    const response = await this.transport.request<{ voteCount: number }>({
      method: "POST",
      url: "/forum/votes",
      body: data,
    });
    return response.data;
  }

  async markAsSolution(questionId: string, data: MarkSolutionPayload): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/forum/questions/${questionId}/solution`,
      body: data,
    });
  }

  async pinAnswer(questionId: string, answerId: string): Promise<void> {
    await this.transport.request({
      method: "PATCH",
      url: `/forum/questions/${questionId}/answers/${answerId}/pin`,
    });
  }
}
