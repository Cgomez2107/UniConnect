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
    userVote: z.ZodOptional<z.ZodNullable<z.ZodEnum<["upvote", "downvote"]>>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "solved" | "closed";
    createdAt: string;
    updatedAt: string;
    id: string;
    subjectId: string;
    title: string;
    authorId: string;
    body: string;
    answerCount: number;
    voteCount: number;
    userVote?: "upvote" | "downvote" | null | undefined;
}, {
    status: "active" | "solved" | "closed";
    createdAt: string;
    updatedAt: string;
    id: string;
    subjectId: string;
    title: string;
    authorId: string;
    body: string;
    answerCount: number;
    voteCount: number;
    userVote?: "upvote" | "downvote" | null | undefined;
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
    createdAt: string;
    updatedAt: string;
    id: string;
    subjectId: string;
    title: string;
    authorId: string;
    answerCount: number;
    voteCount: number;
}, {
    status: "active" | "solved" | "closed";
    createdAt: string;
    updatedAt: string;
    id: string;
    subjectId: string;
    title: string;
    authorId: string;
    answerCount: number;
    voteCount: number;
}>;
export declare const ForumAnswerSchema: z.ZodObject<{
    id: z.ZodString;
    questionId: z.ZodString;
    authorId: z.ZodString;
    authorName: z.ZodString;
    body: z.ZodString;
    voteCount: z.ZodNumber;
    isSolution: z.ZodDefault<z.ZodBoolean>;
    isPinned: z.ZodDefault<z.ZodBoolean>;
    userVote: z.ZodOptional<z.ZodNullable<z.ZodEnum<["upvote", "downvote"]>>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    id: string;
    authorId: string;
    body: string;
    voteCount: number;
    questionId: string;
    authorName: string;
    isSolution: boolean;
    isPinned: boolean;
    userVote?: "upvote" | "downvote" | null | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    id: string;
    authorId: string;
    body: string;
    voteCount: number;
    questionId: string;
    authorName: string;
    userVote?: "upvote" | "downvote" | null | undefined;
    isSolution?: boolean | undefined;
    isPinned?: boolean | undefined;
}>;
export declare const ForumVoteSchema: z.ZodObject<{
    id: z.ZodString;
    targetType: z.ZodEnum<["question", "answer"]>;
    targetId: z.ZodString;
    voterId: z.ZodString;
    voteType: z.ZodEnum<["upvote", "downvote"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    targetType: "question" | "answer";
    targetId: string;
    voterId: string;
    voteType: "upvote" | "downvote";
}, {
    createdAt: string;
    id: string;
    targetType: "question" | "answer";
    targetId: string;
    voterId: string;
    voteType: "upvote" | "downvote";
}>;
export declare const CreateQuestionInputSchema: z.ZodObject<{
    subjectId: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    subjectId: string;
    title: string;
    body: string;
}, {
    subjectId: string;
    title: string;
    body: string;
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
        userVote: z.ZodOptional<z.ZodNullable<z.ZodEnum<["upvote", "downvote"]>>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "solved" | "closed";
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        userVote?: "upvote" | "downvote" | null | undefined;
    }, {
        status: "active" | "solved" | "closed";
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        userVote?: "upvote" | "downvote" | null | undefined;
    }>;
    answers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        questionId: z.ZodString;
        authorId: z.ZodString;
        authorName: z.ZodString;
        body: z.ZodString;
        voteCount: z.ZodNumber;
        isSolution: z.ZodDefault<z.ZodBoolean>;
        isPinned: z.ZodDefault<z.ZodBoolean>;
        userVote: z.ZodOptional<z.ZodNullable<z.ZodEnum<["upvote", "downvote"]>>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        authorId: string;
        body: string;
        voteCount: number;
        questionId: string;
        authorName: string;
        isSolution: boolean;
        isPinned: boolean;
        userVote?: "upvote" | "downvote" | null | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        authorId: string;
        body: string;
        voteCount: number;
        questionId: string;
        authorName: string;
        userVote?: "upvote" | "downvote" | null | undefined;
        isSolution?: boolean | undefined;
        isPinned?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    question: {
        status: "active" | "solved" | "closed";
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        userVote?: "upvote" | "downvote" | null | undefined;
    };
    answers: {
        createdAt: string;
        updatedAt: string;
        id: string;
        authorId: string;
        body: string;
        voteCount: number;
        questionId: string;
        authorName: string;
        isSolution: boolean;
        isPinned: boolean;
        userVote?: "upvote" | "downvote" | null | undefined;
    }[];
}, {
    question: {
        status: "active" | "solved" | "closed";
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        userVote?: "upvote" | "downvote" | null | undefined;
    };
    answers: {
        createdAt: string;
        updatedAt: string;
        id: string;
        authorId: string;
        body: string;
        voteCount: number;
        questionId: string;
        authorName: string;
        userVote?: "upvote" | "downvote" | null | undefined;
        isSolution?: boolean | undefined;
        isPinned?: boolean | undefined;
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
    id: string;
    created_at: string;
    updated_at: string;
    subject_id: string;
    title: string;
    body: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}, {
    status: "active" | "solved" | "closed";
    id: string;
    created_at: string;
    updated_at: string;
    subject_id: string;
    title: string;
    body: string;
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
    created_at: string;
    updated_at: string;
    subject_id: string;
    title: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}, {
    status: "active" | "solved" | "closed";
    id: string;
    created_at: string;
    updated_at: string;
    subject_id: string;
    title: string;
    author_id: string;
    answer_count: number;
    vote_count: number;
}>;
export declare const ForumAnswerDTOSchema: z.ZodObject<{
    id: z.ZodString;
    question_id: z.ZodString;
    author_id: z.ZodString;
    author_name: z.ZodString;
    body: z.ZodString;
    vote_count: z.ZodNumber;
    is_solution: z.ZodDefault<z.ZodBoolean>;
    is_pinned: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    body: string;
    author_id: string;
    vote_count: number;
    question_id: string;
    author_name: string;
    is_solution: boolean;
    is_pinned: boolean;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    body: string;
    author_id: string;
    vote_count: number;
    question_id: string;
    author_name: string;
    is_solution?: boolean | undefined;
    is_pinned?: boolean | undefined;
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