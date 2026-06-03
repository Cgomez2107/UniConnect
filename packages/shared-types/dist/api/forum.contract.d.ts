import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";
export declare const CreateQuestionRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    body: {
        subjectId: string;
        title: string;
        body: string;
    };
}, {
    body: {
        subjectId: string;
        title: string;
        body: string;
    };
}>;
export declare const CreateQuestionResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    data: {
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
}, {
    data: {
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
}>;
export declare const CreateQuestionContract: ApiContract<typeof CreateQuestionRequestSchema, typeof CreateQuestionResponseSchema>;
export declare const ListQuestionsRequestSchema: z.ZodObject<{
    query: z.ZodObject<{
        subjectId: z.ZodOptional<z.ZodString>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        subjectId?: string | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        subjectId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        subjectId?: string | undefined;
    };
}, {
    query: {
        page?: number | undefined;
        limit?: number | undefined;
        subjectId?: string | undefined;
    };
}>;
export declare const ListQuestionsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    meta: z.ZodOptional<z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total?: number | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "active" | "solved" | "closed";
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        title: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
    }[];
    meta?: {
        page: number;
        limit: number;
        total?: number | undefined;
    } | undefined;
}, {
    data: {
        status: "active" | "solved" | "closed";
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        title: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
    }[];
    meta?: {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
    } | undefined;
}>;
export declare const ListQuestionsContract: ApiContract<typeof ListQuestionsRequestSchema, typeof ListQuestionsResponseSchema>;
export declare const GetQuestionDetailRequestSchema: z.ZodObject<{
    params: z.ZodObject<{
        questionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
    }, {
        questionId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        questionId: string;
    };
}, {
    params: {
        questionId: string;
    };
}>;
export declare const GetQuestionDetailResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    data: {
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
    };
}, {
    data: {
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
    };
}>;
export declare const GetQuestionDetailContract: ApiContract<typeof GetQuestionDetailRequestSchema, typeof GetQuestionDetailResponseSchema>;
export declare const CreateAnswerRequestSchema: z.ZodObject<{
    params: z.ZodObject<{
        questionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
    }, {
        questionId: string;
    }>;
    body: z.ZodObject<{
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
    }, {
        body: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        questionId: string;
    };
    body: {
        body: string;
    };
}, {
    params: {
        questionId: string;
    };
    body: {
        body: string;
    };
}>;
export declare const CreateAnswerResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    data: {
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
    };
}, {
    data: {
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
    };
}>;
export declare const CreateAnswerContract: ApiContract<typeof CreateAnswerRequestSchema, typeof CreateAnswerResponseSchema>;
export declare const ListAnswersRequestSchema: z.ZodObject<{
    params: z.ZodObject<{
        questionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
    }, {
        questionId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        questionId: string;
    };
}, {
    params: {
        questionId: string;
    };
}>;
export declare const ListAnswersResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
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
    data: {
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
    data: {
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
export declare const ListAnswersContract: ApiContract<typeof ListAnswersRequestSchema, typeof ListAnswersResponseSchema>;
export declare const MarkSolutionRequestSchema: z.ZodObject<{
    params: z.ZodObject<{
        questionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
    }, {
        questionId: string;
    }>;
    body: z.ZodObject<{
        answerId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        answerId: string;
    }, {
        answerId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        questionId: string;
    };
    body: {
        answerId: string;
    };
}, {
    params: {
        questionId: string;
    };
    body: {
        answerId: string;
    };
}>;
export declare const MarkSolutionResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
    }, {
        message: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        message: string;
    };
}, {
    data: {
        message: string;
    };
}>;
export declare const MarkSolutionContract: ApiContract<typeof MarkSolutionRequestSchema, typeof MarkSolutionResponseSchema>;
export declare const CastVoteRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    body: {
        targetType: "question" | "answer";
        targetId: string;
        voteType: "upvote" | "downvote";
    };
}, {
    body: {
        targetType: "question" | "answer";
        targetId: string;
        voteType: "upvote" | "downvote";
    };
}>;
export declare const CastVoteResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        voteCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        voteCount: number;
    }, {
        voteCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        voteCount: number;
    };
}, {
    data: {
        voteCount: number;
    };
}>;
export declare const CastVoteContract: ApiContract<typeof CastVoteRequestSchema, typeof CastVoteResponseSchema>;
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
export declare const PinAnswerRequestSchema: z.ZodObject<{
    params: z.ZodObject<{
        questionId: z.ZodString;
        answerId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        answerId: string;
    }, {
        questionId: string;
        answerId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        questionId: string;
        answerId: string;
    };
}, {
    params: {
        questionId: string;
        answerId: string;
    };
}>;
export declare const PinAnswerResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    success: true;
}, {
    success: true;
}>;
export declare const PinAnswerContract: ApiContract<typeof PinAnswerRequestSchema, typeof PinAnswerResponseSchema>;
export type ListAnswersRequest = z.infer<typeof ListAnswersRequestSchema>;
export type ListAnswersResponse = z.infer<typeof ListAnswersResponseSchema>;
export type PinAnswerRequest = z.infer<typeof PinAnswerRequestSchema>;
export type PinAnswerResponse = z.infer<typeof PinAnswerResponseSchema>;
//# sourceMappingURL=forum.contract.d.ts.map