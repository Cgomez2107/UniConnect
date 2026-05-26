import { z } from "zod";
import { UuidSchema, PaginationSchema } from "../schemas/_common.schema.js";
import { ForumQuestionSchema, ForumAnswerSchema, ForumQuestionSummarySchema } from "../schemas/forum.schema.js";
import type { ApiContract } from "./_base.contract.js";

export const CreateQuestionRequestSchema = z.object({
  body: z.object({
    subjectId: UuidSchema,
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
  }),
});

export const CreateQuestionResponseSchema = z.object({
  question: ForumQuestionSchema,
});

export const CreateQuestionContract: ApiContract<typeof CreateQuestionRequestSchema, typeof CreateQuestionResponseSchema> = {
  method: "POST",
  path: "/api/v1/forum/questions",
  request: CreateQuestionRequestSchema,
  response: CreateQuestionResponseSchema,
};

export const ListQuestionsRequestSchema = z.object({
  query: z.object({
    subjectId: UuidSchema,
    page: z.coerce.number().int().positive().default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  }),
});

export const ListQuestionsResponseSchema = z.object({
  questions: z.array(ForumQuestionSummarySchema),
  pagination: PaginationSchema.optional(),
});

export const ListQuestionsContract: ApiContract<typeof ListQuestionsRequestSchema, typeof ListQuestionsResponseSchema> = {
  method: "GET",
  path: "/api/v1/forum/questions",
  request: ListQuestionsRequestSchema,
  response: ListQuestionsResponseSchema,
};

export const GetQuestionDetailRequestSchema = z.object({
  params: z.object({
    id: UuidSchema,
  }),
});

export const GetQuestionDetailResponseSchema = z.object({
  question: ForumQuestionSchema,
  answers: z.array(ForumAnswerSchema),
});

export const GetQuestionDetailContract: ApiContract<typeof GetQuestionDetailRequestSchema, typeof GetQuestionDetailResponseSchema> = {
  method: "GET",
  path: "/api/v1/forum/questions/:id",
  request: GetQuestionDetailRequestSchema,
  response: GetQuestionDetailResponseSchema,
};

export const CreateAnswerRequestSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(5000),
  }),
  params: z.object({
    questionId: UuidSchema,
  }),
});

export const CreateAnswerResponseSchema = z.object({
  answer: ForumAnswerSchema,
});

export const CreateAnswerContract: ApiContract<typeof CreateAnswerRequestSchema, typeof CreateAnswerResponseSchema> = {
  method: "POST",
  path: "/api/v1/forum/questions/:questionId/answers",
  request: CreateAnswerRequestSchema,
  response: CreateAnswerResponseSchema,
};

export const CastVoteRequestSchema = z.object({
  body: z.object({
    targetType: z.enum(["question", "answer"]),
    targetId: UuidSchema,
    voteType: z.enum(["upvote", "downvote"]),
  }),
});

export const CastVoteResponseSchema = z.object({
  voteCount: z.number().int(),
});

export const CastVoteContract: ApiContract<typeof CastVoteRequestSchema, typeof CastVoteResponseSchema> = {
  method: "POST",
  path: "/api/v1/forum/votes",
  request: CastVoteRequestSchema,
  response: CastVoteResponseSchema,
};

export const MarkSolutionRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
  }),
  body: z.object({
    answerId: UuidSchema,
  }),
});

export const MarkSolutionResponseSchema = z.object({
  success: z.literal(true),
});

export const MarkSolutionContract: ApiContract<typeof MarkSolutionRequestSchema, typeof MarkSolutionResponseSchema> = {
  method: "POST",
  path: "/api/v1/forum/questions/:questionId/solution",
  request: MarkSolutionRequestSchema,
  response: MarkSolutionResponseSchema,
};

export const ListAnswersRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
  }),
});

export const ListAnswersResponseSchema = z.object({
  answers: z.array(ForumAnswerSchema),
});

export const ListAnswersContract: ApiContract<typeof ListAnswersRequestSchema, typeof ListAnswersResponseSchema> = {
  method: "GET",
  path: "/api/v1/forum/questions/:questionId/answers",
  request: ListAnswersRequestSchema,
  response: ListAnswersResponseSchema,
};

export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;
export type CreateQuestionResponse = z.infer<typeof CreateQuestionResponseSchema>;
export type ListQuestionsRequest = z.infer<typeof ListQuestionsRequestSchema>;
export type ListQuestionsResponse = z.infer<typeof ListQuestionsResponseSchema>;
export type GetQuestionDetailRequest = z.infer<typeof GetQuestionDetailRequestSchema>;
export type GetQuestionDetailResponse = z.infer<typeof GetQuestionDetailResponseSchema>;
export type CreateAnswerRequest = z.infer<typeof CreateAnswerRequestSchema>;
export type CreateAnswerResponse = z.infer<typeof CreateAnswerResponseSchema>;
export type CastVoteRequest = z.infer<typeof CastVoteRequestSchema>;
export type CastVoteResponse = z.infer<typeof CastVoteResponseSchema>;
export type MarkSolutionRequest = z.infer<typeof MarkSolutionRequestSchema>;
export type MarkSolutionResponse = z.infer<typeof MarkSolutionResponseSchema>;
export const PinAnswerRequestSchema = z.object({
  params: z.object({
    questionId: UuidSchema,
    answerId: UuidSchema,
  }),
});

export const PinAnswerResponseSchema = z.object({
  success: z.literal(true),
});

export const PinAnswerContract: ApiContract<typeof PinAnswerRequestSchema, typeof PinAnswerResponseSchema> = {
  method: "PATCH",
  path: "/api/v1/forum/questions/:questionId/answers/:answerId/pin",
  request: PinAnswerRequestSchema,
  response: PinAnswerResponseSchema,
};

export type ListAnswersRequest = z.infer<typeof ListAnswersRequestSchema>;
export type ListAnswersResponse = z.infer<typeof ListAnswersResponseSchema>;
export type PinAnswerRequest = z.infer<typeof PinAnswerRequestSchema>;
export type PinAnswerResponse = z.infer<typeof PinAnswerResponseSchema>;
