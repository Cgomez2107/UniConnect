import { z } from "zod";
import { UuidSchema, PaginationSchema } from "../schemas/_common.schema.js";
import {
  ForumQuestionSchema,
  ForumQuestionSummarySchema,
  ForumAnswerSchema,
  ForumQuestionDetailSchema,
} from "../schemas/forum.schema.js";
import type { ApiContract } from "./_base.contract.js";

// ── Create Question ─────────────────────────────────────────────────────────
export const CreateQuestionRequestSchema = z.object({
  body: z.object({
    subjectId: UuidSchema,
    title: z.string().min(5).max(300),
    body: z.string().min(10).max(10000),
  }),
});

export const CreateQuestionResponseSchema = z.object({
  data: ForumQuestionSchema,
});

export const CreateQuestionContract: ApiContract<
  typeof CreateQuestionRequestSchema,
  typeof CreateQuestionResponseSchema
> = {
  method: "POST",
  path: "/api/v1/forum/questions",
  request: CreateQuestionRequestSchema,
  response: CreateQuestionResponseSchema,
};

// ── List Questions ──────────────────────────────────────────────────────────
export const ListQuestionsRequestSchema = z.object({
  query: z.object({
    subjectId: UuidSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const ListQuestionsResponseSchema = z.object({
  data: z.array(ForumQuestionSummarySchema),
  meta: PaginationSchema.optional(),
});

export const ListQuestionsContract: ApiContract<
  typeof ListQuestionsRequestSchema,
  typeof ListQuestionsResponseSchema
> = {
  method: "GET",
  path: "/api/v1/forum/questions",
  request: ListQuestionsRequestSchema,
  response: ListQuestionsResponseSchema,
};

// ── Get Question Detail ─────────────────────────────────────────────────────
export const GetQuestionDetailRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
  }),
});

export const GetQuestionDetailResponseSchema = z.object({
  data: ForumQuestionDetailSchema,
});

export const GetQuestionDetailContract: ApiContract<
  typeof GetQuestionDetailRequestSchema,
  typeof GetQuestionDetailResponseSchema
> = {
  method: "GET",
  path: "/api/v1/forum/questions/:questionId",
  request: GetQuestionDetailRequestSchema,
  response: GetQuestionDetailResponseSchema,
};

// ── Create Answer ───────────────────────────────────────────────────────────
export const CreateAnswerRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
  }),
  body: z.object({
    body: z.string().min(1).max(5000),
  }),
});

export const CreateAnswerResponseSchema = z.object({
  data: ForumAnswerSchema,
});

export const CreateAnswerContract: ApiContract<
  typeof CreateAnswerRequestSchema,
  typeof CreateAnswerResponseSchema
> = {
  method: "POST",
  path: "/api/v1/forum/questions/:questionId/answers",
  request: CreateAnswerRequestSchema,
  response: CreateAnswerResponseSchema,
};

// ── List Answers ────────────────────────────────────────────────────────────
export const ListAnswersRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
  }),
});

export const ListAnswersResponseSchema = z.object({
  data: z.array(ForumAnswerSchema),
});

export const ListAnswersContract: ApiContract<
  typeof ListAnswersRequestSchema,
  typeof ListAnswersResponseSchema
> = {
  method: "GET",
  path: "/api/v1/forum/questions/:questionId/answers",
  request: ListAnswersRequestSchema,
  response: ListAnswersResponseSchema,
};

// ── Mark as Solution ────────────────────────────────────────────────────────
export const MarkSolutionRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
  }),
  body: z.object({
    answerId: UuidSchema,
  }),
});

export const MarkSolutionResponseSchema = z.object({
  data: z.object({
    message: z.string(),
  }),
});

export const MarkSolutionContract: ApiContract<
  typeof MarkSolutionRequestSchema,
  typeof MarkSolutionResponseSchema
> = {
  method: "POST",
  path: "/api/v1/forum/questions/:questionId/solution",
  request: MarkSolutionRequestSchema,
  response: MarkSolutionResponseSchema,
};

// ── Cast Vote ───────────────────────────────────────────────────────────────
export const CastVoteRequestSchema = z.object({
  body: z.object({
    targetType: z.enum(["question", "answer"]),
    targetId: UuidSchema,
    voteType: z.enum(["upvote", "downvote"]),
  }),
});

export const CastVoteResponseSchema = z.object({
  data: z.object({
    voteCount: z.number().int(),
  }),
});

export const CastVoteContract: ApiContract<
  typeof CastVoteRequestSchema,
  typeof CastVoteResponseSchema
> = {
  method: "POST",
  path: "/api/v1/forum/votes",
  request: CastVoteRequestSchema,
  response: CastVoteResponseSchema,
};

// ── Inferred Types ──────────────────────────────────────────────────────────
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;
export type CreateQuestionResponse = z.infer<typeof CreateQuestionResponseSchema>;
export type ListQuestionsRequest = z.infer<typeof ListQuestionsRequestSchema>;
export type ListQuestionsResponse = z.infer<typeof ListQuestionsResponseSchema>;
export type GetQuestionDetailRequest = z.infer<typeof GetQuestionDetailRequestSchema>;
export type GetQuestionDetailResponse = z.infer<typeof GetQuestionDetailResponseSchema>;
export type CreateAnswerRequest = z.infer<typeof CreateAnswerRequestSchema>;
export type CreateAnswerResponse = z.infer<typeof CreateAnswerResponseSchema>;
export type ListAnswersRequest = z.infer<typeof ListAnswersRequestSchema>;
export type ListAnswersResponse = z.infer<typeof ListAnswersResponseSchema>;
export type MarkSolutionRequest = z.infer<typeof MarkSolutionRequestSchema>;
export type MarkSolutionResponse = z.infer<typeof MarkSolutionResponseSchema>;
export type CastVoteRequest = z.infer<typeof CastVoteRequestSchema>;
export type CastVoteResponse = z.infer<typeof CastVoteResponseSchema>;
