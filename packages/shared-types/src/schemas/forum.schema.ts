import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema.js";

export const ForumQuestionSchema = z.object({
  id: UuidSchema,
  subjectId: UuidSchema,
  authorId: UuidSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  status: z.enum(["active", "solved"]),
  answerCount: z.number().int().nonnegative(),
  voteCount: z.number().int(),
  userVote: z.enum(["upvote", "downvote"]).nullable().optional(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const ForumQuestionDTOSchema = z.object({
  id: UuidSchema,
  subject_id: UuidSchema,
  author_id: UuidSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  status: z.enum(["active", "solved"]),
  answer_count: z.number().int().nonnegative(),
  vote_count: z.number().int(),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});

export const ForumAnswerSchema = z.object({
  id: UuidSchema,
  questionId: UuidSchema,
  authorId: UuidSchema,
  authorName: z.string(),
  body: z.string().min(1).max(5000),
  voteCount: z.number().int(),
  isSolution: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  userVote: z.enum(["upvote", "downvote"]).nullable().optional(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const ForumAnswerDTOSchema = z.object({
  id: UuidSchema,
  question_id: UuidSchema,
  author_id: UuidSchema,
  author_name: z.string(),
  body: z.string().min(1).max(5000),
  vote_count: z.number().int(),
  is_solution: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});

export const ForumVoteSchema = z.object({
  id: UuidSchema,
  targetType: z.enum(["question", "answer"]),
  targetId: UuidSchema,
  voterId: UuidSchema,
  voteType: z.enum(["upvote", "downvote"]),
  createdAt: DateStringSchema,
});

export const ForumQuestionSummarySchema = z.object({
  id: UuidSchema,
  subjectId: UuidSchema,
  authorId: UuidSchema,
  title: z.string().min(1).max(200),
  status: z.enum(["active", "solved"]),
  answerCount: z.number().int().nonnegative(),
  voteCount: z.number().int(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const QuestionSummarySchema = ForumQuestionSummarySchema;

export const ForumVoteDTOSchema = z.object({
  id: UuidSchema,
  target_type: z.enum(["question", "answer"]),
  target_id: UuidSchema,
  voter_id: UuidSchema,
  vote_type: z.enum(["upvote", "downvote"]),
  created_at: DateStringSchema,
});

export const QuestionSummaryDTOSchema = z.object({
  id: UuidSchema,
  subject_id: UuidSchema,
  author_id: UuidSchema,
  title: z.string().min(1).max(200),
  status: z.enum(["active", "solved"]),
  answer_count: z.number().int().nonnegative(),
  vote_count: z.number().int(),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});
