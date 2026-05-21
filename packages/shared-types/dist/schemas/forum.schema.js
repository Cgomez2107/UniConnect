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
export const ForumQuestionDTOSchema = z.object({
    id: UuidSchema,
    subject_id: UuidSchema,
    author_id: UuidSchema,
    title: z.string().min(5).max(300),
    body: z.string().min(10).max(10000),
    status: ForumQuestionStatusEnum,
    answer_count: z.number().int().nonnegative(),
    vote_count: z.number().int(),
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
});
export const ForumQuestionSummaryDTOSchema = z.object({
    id: UuidSchema,
    subject_id: UuidSchema,
    author_id: UuidSchema,
    title: z.string().min(5).max(300),
    status: ForumQuestionStatusEnum,
    answer_count: z.number().int().nonnegative(),
    vote_count: z.number().int(),
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
});
export const ForumAnswerDTOSchema = z.object({
    id: UuidSchema,
    question_id: UuidSchema,
    author_id: UuidSchema,
    body: z.string().min(1).max(5000),
    vote_count: z.number().int(),
    is_solution: z.boolean(),
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
});
export const ForumVoteDTOSchema = z.object({
    id: UuidSchema,
    target_type: ForumVoteTargetTypeEnum,
    target_id: UuidSchema,
    voter_id: UuidSchema,
    vote_type: ForumVoteTypeEnum,
    created_at: DateStringSchema,
});
//# sourceMappingURL=forum.schema.js.map