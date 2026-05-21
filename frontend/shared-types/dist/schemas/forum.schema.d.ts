import { z } from "zod";
export declare const ForumQuestionStatusEnum: z.ZodEnum<["active", "solved", "closed"]>;
export declare const ForumVoteTargetTypeEnum: z.ZodEnum<["question", "answer"]>;
export declare const ForumVoteTypeEnum: z.ZodEnum<["upvote", "downvote"]>;
export declare const ForumQuestionSchema: z.ZodObject<{
    id: z.ZodString;
    subjectId: z.ZodString;
    authorId: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    status: z.ZodEnum<["active", "solved", "closed"]>;
    answerCount: z.ZodNumber;
    voteCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "solved" | "closed";
    body: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    subjectId: string;
    authorId: string;
    answerCount: number;
    voteCount: number;
}, {
    status: "active" | "solved" | "closed";
    body: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    subjectId: string;
    authorId: string;
    answerCount: number;
    voteCount: number;
}>;
export declare const ForumQuestionSummarySchema: z.ZodObject<{
    id: z.ZodString;
    subjectId: z.ZodString;
    authorId: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["active", "solved", "closed"]>;
    answerCount: z.ZodNumber;
    voteCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "solved" | "closed";
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    subjectId: string;
    authorId: string;
    answerCount: number;
    voteCount: number;
}, {
    status: "active" | "solved" | "closed";
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    subjectId: string;
    authorId: string;
    answerCount: number;
    voteCount: number;
}>;
export declare const ForumAnswerSchema: z.ZodObject<{
    id: z.ZodString;
    questionId: z.ZodString;
    authorId: z.ZodString;
    body: z.ZodString;
    voteCount: z.ZodNumber;
    isSolution: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    voteCount: number;
    questionId: string;
    isSolution: boolean;
}, {
    body: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    voteCount: number;
    questionId: string;
    isSolution: boolean;
}>;
export declare const ForumVoteSchema: z.ZodObject<{
    id: z.ZodString;
    targetType: z.ZodEnum<["question", "answer"]>;
    targetId: z.ZodString;
    voterId: z.ZodString;
    voteType: z.ZodEnum<["upvote", "downvote"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    targetType: "question" | "answer";
    targetId: string;
    voteType: "upvote" | "downvote";
    voterId: string;
}, {
    id: string;
    createdAt: string;
    targetType: "question" | "answer";
    targetId: string;
    voteType: "upvote" | "downvote";
    voterId: string;
}>;
export declare const CreateQuestionInputSchema: z.ZodObject<{
    subjectId: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
    title: string;
    subjectId: string;
}, {
    body: string;
    title: string;
    subjectId: string;
}>;
export declare const CreateAnswerInputSchema: z.ZodObject<{
    questionId: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
    questionId: string;
}, {
    body: string;
    questionId: string;
}>;
export declare const CastVoteInputSchema: z.ZodObject<{
    targetType: z.ZodEnum<["question", "answer"]>;
    targetId: z.ZodString;
    voteType: z.ZodEnum<["upvote", "downvote"]>;
}, "strip", z.ZodTypeAny, {
    targetType: "question" | "answer";
    targetId: string;
    voteType: "upvote" | "downvote";
}, {
    targetType: "question" | "answer";
    targetId: string;
    voteType: "upvote" | "downvote";
}>;
export declare const ForumQuestionDetailSchema: z.ZodObject<{
    question: z.ZodObject<{
        id: z.ZodString;
        subjectId: z.ZodString;
        authorId: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        status: z.ZodEnum<["active", "solved", "closed"]>;
        answerCount: z.ZodNumber;
        voteCount: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "solved" | "closed";
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string;
        subjectId: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
    }, {
        status: "active" | "solved" | "closed";
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string;
        subjectId: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
    }>;
    answers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        questionId: z.ZodString;
        authorId: z.ZodString;
        body: z.ZodString;
        voteCount: z.ZodNumber;
        isSolution: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        authorId: string;
        voteCount: number;
        questionId: string;
        isSolution: boolean;
    }, {
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        authorId: string;
        voteCount: number;
        questionId: string;
        isSolution: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    question: {
        status: "active" | "solved" | "closed";
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string;
        subjectId: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
    };
    answers: {
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        authorId: string;
        voteCount: number;
        questionId: string;
        isSolution: boolean;
    }[];
}, {
    question: {
        status: "active" | "solved" | "closed";
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string;
        subjectId: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
    };
    answers: {
        body: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        authorId: string;
        voteCount: number;
        questionId: string;
        isSolution: boolean;
    }[];
}>;
export type ForumQuestion = z.infer<typeof ForumQuestionSchema>;
export type ForumQuestionSummary = z.infer<typeof ForumQuestionSummarySchema>;
export type ForumAnswer = z.infer<typeof ForumAnswerSchema>;
export type ForumVote = z.infer<typeof ForumVoteSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>;
export type CreateAnswerInput = z.infer<typeof CreateAnswerInputSchema>;
export type CastVoteInput = z.infer<typeof CastVoteInputSchema>;
export type ForumQuestionDetail = z.infer<typeof ForumQuestionDetailSchema>;
export declare const ForumQuestionDTOSchema: z.ZodObject<{
    id: z.ZodString;
    subject_id: z.ZodString;
    author_id: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    status: z.ZodEnum<["active", "solved", "closed"]>;
    answer_count: z.ZodNumber;
    vote_count: z.ZodNumber;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "solved" | "closed";
    body: string;
    id: string;
    title: string;
    subject_id: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}, {
    status: "active" | "solved" | "closed";
    body: string;
    id: string;
    title: string;
    subject_id: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}>;
export declare const ForumQuestionSummaryDTOSchema: z.ZodObject<{
    id: z.ZodString;
    subject_id: z.ZodString;
    author_id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["active", "solved", "closed"]>;
    answer_count: z.ZodNumber;
    vote_count: z.ZodNumber;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "solved" | "closed";
    id: string;
    title: string;
    subject_id: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}, {
    status: "active" | "solved" | "closed";
    id: string;
    title: string;
    subject_id: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}>;
export declare const ForumAnswerDTOSchema: z.ZodObject<{
    id: z.ZodString;
    question_id: z.ZodString;
    author_id: z.ZodString;
    body: z.ZodString;
    vote_count: z.ZodNumber;
    is_solution: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
    id: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    vote_count: number;
    question_id: string;
    is_solution: boolean;
}, {
    body: string;
    id: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    vote_count: number;
    question_id: string;
    is_solution: boolean;
}>;
export declare const ForumVoteDTOSchema: z.ZodObject<{
    id: z.ZodString;
    target_type: z.ZodEnum<["question", "answer"]>;
    target_id: z.ZodString;
    voter_id: z.ZodString;
    vote_type: z.ZodEnum<["upvote", "downvote"]>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    target_type: "question" | "answer";
    target_id: string;
    voter_id: string;
    vote_type: "upvote" | "downvote";
}, {
    id: string;
    created_at: string;
    target_type: "question" | "answer";
    target_id: string;
    voter_id: string;
    vote_type: "upvote" | "downvote";
}>;
//# sourceMappingURL=forum.schema.d.ts.map