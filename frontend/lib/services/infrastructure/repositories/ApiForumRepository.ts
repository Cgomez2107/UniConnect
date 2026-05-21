import { fetchApi } from "@/lib/api/httpClient";
import type { IForumRepository } from "../../domain/repositories/IForumRepository";
import type { ForumQuestion, ForumQuestionSummary, ForumAnswer, ForumVotePayload } from "@/types";

function mapQuestionFromApi(raw: any): ForumQuestion {
  return {
    id: raw.id,
    subject_id: raw.subject_id ?? raw.subjectId,
    author_id: raw.author_id ?? raw.authorId,
    title: raw.title,
    body: raw.body,
    status: raw.status,
    answer_count: raw.answer_count ?? raw.answerCount ?? 0,
    vote_count: raw.vote_count ?? raw.voteCount ?? 0,
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
  };
}

function mapSummaryFromApi(raw: any): ForumQuestionSummary {
  return {
    id: raw.id,
    subject_id: raw.subject_id ?? raw.subjectId,
    author_id: raw.author_id ?? raw.authorId,
    title: raw.title,
    status: raw.status,
    answer_count: raw.answer_count ?? raw.answerCount ?? 0,
    vote_count: raw.vote_count ?? raw.voteCount ?? 0,
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
  };
}

function mapAnswerFromApi(raw: any): ForumAnswer {
  return {
    id: raw.id,
    question_id: raw.question_id ?? raw.questionId,
    author_id: raw.author_id ?? raw.authorId,
    body: raw.body,
    vote_count: raw.vote_count ?? raw.voteCount ?? 0,
    is_solution: raw.is_solution ?? raw.isSolution ?? false,
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
  };
}

export class ApiForumRepository implements IForumRepository {
  async createQuestion(subjectId: string, title: string, body: string): Promise<ForumQuestion> {
    const data = await fetchApi<any>("/forum/questions", {
      method: "POST",
      body: JSON.stringify({ subjectId, title, body }),
    });
    return mapQuestionFromApi(data.question ?? data);
  }

  async listQuestions(subjectId: string, page = 1, limit = 20): Promise<ForumQuestionSummary[]> {
    const query = new URLSearchParams({
      subjectId,
      page: String(page),
      limit: String(limit),
    });

    const data: any = await fetchApi(`/forum/questions?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const raw = Array.isArray(data) ? (data as any[]) : ((data?.questions ?? data?.data) as any[]) ?? [];
    return raw.map(mapSummaryFromApi);
  }

  async getQuestionDetail(id: string): Promise<{ question: ForumQuestion; answers: ForumAnswer[] }> {
    const data = await fetchApi<any>(`/forum/questions/${id}`);
    return {
      question: mapQuestionFromApi(data.question ?? data),
      answers: (data.answers ?? data.data?.answers ?? []).map(mapAnswerFromApi),
    };
  }

  async createAnswer(questionId: string, body: string): Promise<ForumAnswer> {
    const data = await fetchApi<any>(`/forum/questions/${questionId}/answers`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    return mapAnswerFromApi(data);
  }

  async listAnswers(questionId: string): Promise<ForumAnswer[]> {
    const data = await fetchApi<any[]>(`/forum/questions/${questionId}/answers`);
    return (Array.isArray(data) ? data : []).map(mapAnswerFromApi);
  }

  async castVote(payload: ForumVotePayload): Promise<{ voteCount: number }> {
    const data = await fetchApi<any>("/forum/votes", {
      method: "POST",
      body: JSON.stringify({
        targetType: payload.target_type,
        targetId: payload.target_id,
        voteType: payload.vote_type,
      }),
    });
    return { voteCount: data.voteCount ?? data.vote_count ?? 0 };
  }

  async markAsSolution(questionId: string, answerId: string): Promise<void> {
    await fetchApi(`/forum/questions/${questionId}/solution`, {
      method: "POST",
      body: JSON.stringify({ answerId }),
    });
  }
}
