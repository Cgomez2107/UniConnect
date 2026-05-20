import { deps } from "@/store/deps";
import type { CreateQuestionPayload, CreateAnswerPayload, CastVotePayload, ForumQuestion, ForumQuestionSummary, ForumAnswer } from "@uniconnect/shared-api";
import { ForumValidatorFactory } from "./chainOfResponsibility";

export interface QuestionDetail {
  question: ForumQuestion;
  answers: ForumAnswer[];
}

const forumClient = deps.apiClients.forum;

async function isEnrolled(subjectId: string): Promise<boolean> {
  try {
    const mySubjects = await deps.apiClients.profiles.getMySubjects();
    return mySubjects.some((s) => s.subjectId === subjectId);
  } catch {
    return false;
  }
}

export const forumService = {
  async createQuestion(data: CreateQuestionPayload): Promise<ForumQuestion> {
    const validator = ForumValidatorFactory.createQuestionChain(isEnrolled);
    const result = await validator.validate(data as unknown as Record<string, unknown>);
    if (!result.isValid) {
      throw new Error(result.error);
    }
    return forumClient.createQuestion(data);
  },

  async listQuestions(subjectId: string, page = 1, limit = 20): Promise<ForumQuestionSummary[]> {
    return forumClient.listQuestions(subjectId, page, limit);
  },

  async getQuestionDetail(questionId: string): Promise<QuestionDetail> {
    return forumClient.getQuestionDetail(questionId);
  },

  async createAnswer(questionId: string, data: CreateAnswerPayload): Promise<ForumAnswer> {
    return forumClient.createAnswer(questionId, data);
  },

  async castVote(data: CastVotePayload): Promise<{ voteCount: number }> {
    return forumClient.castVote(data);
  },

  async markAsSolution(questionId: string, answerId: string): Promise<void> {
    return forumClient.markAsSolution(questionId, { answerId });
  },
};
