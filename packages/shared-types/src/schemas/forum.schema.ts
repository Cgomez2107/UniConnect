import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema.js";

export const ForumQuestionStatusEnum = z.enum(["active", "solved", "closed"]);

export const ForumVoteTargetTypeEnum = z.enum(["question", "answer"]);

export const ForumVoteTypeEnum = z.enum(["upvote", "downvote"]);

export const ForumQuestionSchema = z.object({
  id: UuidSchema,
  subjectId: UuidSchema,
  authorId: UuidSchema,
  title: z.string().min(5).max(300),
  body: z.string().min(10).max(10000),
  status: ForumQuestionStatusEnum,
  answerCount: z.number().int().nonnegative(),
  voteCount: z.number().int(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const ForumQuestionSummarySchema = z.object({
  id: UuidSchema,
  subjectId: UuidSchema,
  authorId: UuidSchema,
  title: z.string().min(5).max(300),
  status: ForumQuestionStatusEnum,
  answerCount: z.number().int().nonnegative(),
  voteCount: z.number().int(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const ForumAnswerSchema = z.object({
  id: UuidSchema,
  questionId: UuidSchema,
  authorId: UuidSchema,
  body: z.string().min(1).max(5000),
  voteCount: z.number().int(),
  isSolution: z.boolean(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const ForumVoteSchema = z.object({
  id: UuidSchema,
  targetType: ForumVoteTargetTypeEnum,
  targetId: UuidSchema,
  voterId: UuidSchema,
  voteType: ForumVoteTypeEnum,
  createdAt: DateStringSchema,
});

export const CreateQuestionInputSchema = z.object({
  subjectId: UuidSchema,
  title: z.string().min(5).max(300),
  body: z.string().min(10).max(10000),
});

export const CreateAnswerInputSchema = z.object({
  questionId: UuidSchema,
  body: z.string().min(1).max(5000),
});

export const CastVoteInputSchema = z.object({
  targetType: ForumVoteTargetTypeEnum,
  targetId: UuidSchema,
  voteType: ForumVoteTypeEnum,
});

export const ForumQuestionDetailSchema = z.object({
  question: ForumQuestionSchema,
  answers: z.array(ForumAnswerSchema),
});

export type ForumQuestion = z.infer<typeof ForumQuestionSchema>;
export type ForumQuestionSummary = z.infer<typeof ForumQuestionSummarySchema>;
export type ForumAnswer = z.infer<typeof ForumAnswerSchema>;
export type ForumVote = z.infer<typeof ForumVoteSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>;
export type CreateAnswerInput = z.infer<typeof CreateAnswerInputSchema>;
export type CastVoteInput = z.infer<typeof CastVoteInputSchema>;
export type ForumQuestionDetail = z.infer<typeof ForumQuestionDetailSchema>;
