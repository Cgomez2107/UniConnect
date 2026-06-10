import { z } from "zod";
export declare const Get_forum_questions_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        authorId: z.ZodString;
        subjectId: z.ZodOptional<z.ZodString>;
        status: z.ZodString;
        answerCount: z.ZodNumber;
        voteCount: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    }, {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_forum_questions_RequestBodySchema: z.ZodObject<{
    subjectId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    body: string;
    subjectId?: string | undefined;
}, {
    title: string;
    body: string;
    subjectId?: string | undefined;
}>;
export declare const Post_forum_questions_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        authorId: z.ZodString;
        subjectId: z.ZodOptional<z.ZodString>;
        status: z.ZodString;
        answerCount: z.ZodNumber;
        voteCount: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    }, {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    };
}, {
    data: {
        status: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        authorId: string;
        body: string;
        answerCount: number;
        voteCount: number;
        subjectId?: string | undefined;
    };
}>;
export declare const Get_forum_questions_questionId_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        question: z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            authorId: z.ZodString;
            subjectId: z.ZodOptional<z.ZodString>;
            status: z.ZodString;
            answerCount: z.ZodNumber;
            voteCount: z.ZodNumber;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            status: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            title: string;
            authorId: string;
            body: string;
            answerCount: number;
            voteCount: number;
            subjectId?: string | undefined;
        }, {
            status: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            title: string;
            authorId: string;
            body: string;
            answerCount: number;
            voteCount: number;
            subjectId?: string | undefined;
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
            createdAt: string;
            updatedAt: string;
            id: string;
            authorId: string;
            body: string;
            voteCount: number;
            questionId: string;
            isSolution: boolean;
        }, {
            createdAt: string;
            updatedAt: string;
            id: string;
            authorId: string;
            body: string;
            voteCount: number;
            questionId: string;
            isSolution: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        question: {
            status: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            title: string;
            authorId: string;
            body: string;
            answerCount: number;
            voteCount: number;
            subjectId?: string | undefined;
        };
        answers: {
            createdAt: string;
            updatedAt: string;
            id: string;
            authorId: string;
            body: string;
            voteCount: number;
            questionId: string;
            isSolution: boolean;
        }[];
    }, {
        question: {
            status: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            title: string;
            authorId: string;
            body: string;
            answerCount: number;
            voteCount: number;
            subjectId?: string | undefined;
        };
        answers: {
            createdAt: string;
            updatedAt: string;
            id: string;
            authorId: string;
            body: string;
            voteCount: number;
            questionId: string;
            isSolution: boolean;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        question: {
            status: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            title: string;
            authorId: string;
            body: string;
            answerCount: number;
            voteCount: number;
            subjectId?: string | undefined;
        };
        answers: {
            createdAt: string;
            updatedAt: string;
            id: string;
            authorId: string;
            body: string;
            voteCount: number;
            questionId: string;
            isSolution: boolean;
        }[];
    };
}, {
    data: {
        question: {
            status: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            title: string;
            authorId: string;
            body: string;
            answerCount: number;
            voteCount: number;
            subjectId?: string | undefined;
        };
        answers: {
            createdAt: string;
            updatedAt: string;
            id: string;
            authorId: string;
            body: string;
            voteCount: number;
            questionId: string;
            isSolution: boolean;
        }[];
    };
}>;
export declare const Get_forum_questions_questionId_answers_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        questionId: z.ZodString;
        authorId: z.ZodString;
        body: z.ZodString;
        voteCount: z.ZodNumber;
        isSolution: z.ZodBoolean;
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
        isSolution: boolean;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        authorId: string;
        body: string;
        voteCount: number;
        questionId: string;
        isSolution: boolean;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
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
        isSolution: boolean;
    }[];
    meta: {
        total: number;
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
        isSolution: boolean;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_forum_questions_questionId_answers_RequestBodySchema: z.ZodObject<{
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
}, {
    body: string;
}>;
export declare const Post_forum_questions_questionId_answers_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        questionId: z.ZodString;
        authorId: z.ZodString;
        body: z.ZodString;
        voteCount: z.ZodNumber;
        isSolution: z.ZodBoolean;
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
        isSolution: boolean;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        authorId: string;
        body: string;
        voteCount: number;
        questionId: string;
        isSolution: boolean;
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
        isSolution: boolean;
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
        isSolution: boolean;
    };
}>;
export declare const Post_forum_questions_questionId_solution_RequestBodySchema: z.ZodObject<{
    answerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    answerId: string;
}, {
    answerId: string;
}>;
export declare const Post_forum_questions_questionId_solution_200ResponseSchema: z.ZodObject<{
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
export declare const Post_forum_votes_RequestBodySchema: z.ZodObject<{
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
export declare const Post_auth_signin_RequestBodySchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const Post_auth_signin_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profileImageUrl: z.ZodOptional<z.ZodString>;
            isVerified: z.ZodBoolean;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            isOnboarded: z.ZodBoolean;
            lastLoginAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        }, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        }>;
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }, {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}, {
    data: {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}>;
export declare const Post_auth_signup_RequestBodySchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
    password: string;
}, {
    email: string;
    fullName: string;
    password: string;
}>;
export declare const Post_auth_signup_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            fullName: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
        }, "strip", z.ZodTypeAny, {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            fullName: string;
        }, {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            fullName: string;
        }>;
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        user: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            fullName: string;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }, {
        user: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            fullName: string;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        user: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            fullName: string;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}, {
    data: {
        user: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            fullName: string;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}>;
export declare const Post_auth_refresh_RequestBodySchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const Post_auth_refresh_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }, {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}, {
    data: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}>;
export declare const Get_auth_session_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        session: z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodString;
                email: z.ZodString;
                fullName: z.ZodString;
                role: z.ZodEnum<["estudiante", "admin"]>;
            }, "strip", z.ZodTypeAny, {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            }, {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            }>;
            accessToken: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            user: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            };
            accessToken: string;
        }, {
            user: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            };
            accessToken: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        session: {
            user: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            };
            accessToken: string;
        };
    }, {
        session: {
            user: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            };
            accessToken: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        session: {
            user: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            };
            accessToken: string;
        };
    };
}, {
    data: {
        session: {
            user: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                fullName: string;
            };
            accessToken: string;
        };
    };
}>;
export declare const Get_auth_me_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        fullName: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    }, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    };
}, {
    data: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    };
}>;
export declare const Get_auth_google_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        url: string;
    };
}, {
    data: {
        url: string;
    };
}>;
export declare const Post_auth_google_RequestBodySchema: z.ZodObject<{
    redirectTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    redirectTo?: string | undefined;
}, {
    redirectTo?: string | undefined;
}>;
export declare const Post_auth_google_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        url: string;
    };
}, {
    data: {
        url: string;
    };
}>;
export declare const Post_auth_oauth_callback_RequestBodySchema: z.ZodObject<{
    accessToken: z.ZodString;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    accessToken: string;
}, {
    email: string;
    accessToken: string;
}>;
export declare const Post_auth_oauth_callback_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profileImageUrl: z.ZodOptional<z.ZodString>;
            isVerified: z.ZodBoolean;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            isOnboarded: z.ZodBoolean;
            lastLoginAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        }, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
    }, {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
    };
}, {
    data: {
        user: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            isOnboarded: boolean;
            profileImageUrl?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        accessToken: string;
        refreshToken: string;
    };
}>;
export declare const Get_events_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startAt: z.ZodString;
        endAt: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        organizerId: z.ZodString;
        organizerName: z.ZodOptional<z.ZodString>;
        maxCapacity: z.ZodOptional<z.ZodNumber>;
        registeredCount: z.ZodOptional<z.ZodNumber>;
        category: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_events_RequestBodySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    eventDate: z.ZodString;
    endAt: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    maxCapacity: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    eventDate: string;
    category: string;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    maxCapacity?: number | undefined;
    imageUrl?: string | undefined;
}, {
    title: string;
    eventDate: string;
    category: string;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    maxCapacity?: number | undefined;
    imageUrl?: string | undefined;
}>;
export declare const Post_events_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startAt: z.ZodString;
        endAt: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        organizerId: z.ZodString;
        organizerName: z.ZodOptional<z.ZodString>;
        maxCapacity: z.ZodOptional<z.ZodNumber>;
        registeredCount: z.ZodOptional<z.ZodNumber>;
        category: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    };
}>;
export declare const Get_events_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startAt: z.ZodString;
        endAt: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        organizerId: z.ZodString;
        organizerName: z.ZodOptional<z.ZodString>;
        maxCapacity: z.ZodOptional<z.ZodNumber>;
        registeredCount: z.ZodOptional<z.ZodNumber>;
        category: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    };
}>;
export declare const Put_events_id_RequestBodySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    eventDate: z.ZodOptional<z.ZodString>;
    endAt: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    maxCapacity: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    eventDate?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    maxCapacity?: number | undefined;
    imageUrl?: string | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    eventDate?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    maxCapacity?: number | undefined;
    imageUrl?: string | undefined;
}>;
export declare const Put_events_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startAt: z.ZodString;
        endAt: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        organizerId: z.ZodString;
        organizerName: z.ZodOptional<z.ZodString>;
        maxCapacity: z.ZodOptional<z.ZodNumber>;
        registeredCount: z.ZodOptional<z.ZodNumber>;
        category: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        title: string;
        category: string;
        startAt: string;
        organizerId: string;
        status?: string | undefined;
        description?: string | undefined;
        location?: string | undefined;
        endAt?: string | undefined;
        organizerName?: string | undefined;
        maxCapacity?: number | undefined;
        registeredCount?: number | undefined;
        imageUrl?: string | undefined;
    };
}>;
export declare const Delete_events_id_200ResponseSchema: z.ZodObject<{
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
export declare const Post_eventos_suscribir_RequestBodySchema: z.ZodObject<{
    categoria: z.ZodString;
}, "strip", z.ZodTypeAny, {
    categoria: string;
}, {
    categoria: string;
}>;
export declare const Post_eventos_suscribir_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
    }, {
        message: string;
        success: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        message: string;
        success: boolean;
    };
}, {
    data: {
        message: string;
        success: boolean;
    };
}>;
export declare const Get_eventos_suscripciones_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        userId: z.ZodString;
        categories: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        categories: string[];
    }, {
        userId: string;
        categories: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        userId: string;
        categories: string[];
    };
}, {
    data: {
        userId: string;
        categories: string[];
    };
}>;
export declare const Delete_eventos_suscribir_RequestBodySchema: z.ZodObject<{
    categoria: z.ZodString;
}, "strip", z.ZodTypeAny, {
    categoria: string;
}, {
    categoria: string;
}>;
export declare const Delete_eventos_suscribir_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
    }, {
        message: string;
        success: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        message: string;
        success: boolean;
    };
}, {
    data: {
        message: string;
        success: boolean;
    };
}>;
export declare const Get_conversations_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        participantA: z.ZodString;
        participantB: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        lastMessage: z.ZodNullable<z.ZodString>;
        lastMessageAt: z.ZodNullable<z.ZodString>;
        unreadCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_conversations_RequestBodySchema: z.ZodObject<{
    participantB: z.ZodString;
}, "strip", z.ZodTypeAny, {
    participantB: string;
}, {
    participantB: string;
}>;
export declare const Post_conversations_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        participantA: z.ZodString;
        participantB: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        lastMessage: z.ZodNullable<z.ZodString>;
        lastMessageAt: z.ZodNullable<z.ZodString>;
        unreadCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    };
}>;
export declare const Post_conversations_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        participantA: z.ZodString;
        participantB: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        lastMessage: z.ZodNullable<z.ZodString>;
        lastMessageAt: z.ZodNullable<z.ZodString>;
        unreadCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    };
}>;
export declare const Get_conversations_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        participantA: z.ZodString;
        participantB: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        lastMessage: z.ZodNullable<z.ZodString>;
        lastMessageAt: z.ZodNullable<z.ZodString>;
        unreadCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        participantA: string;
        participantB: string;
    };
}>;
export declare const Patch_conversations_id_read_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        count: z.ZodNumber;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        count: number;
    }, {
        message: string;
        count: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        message: string;
        count: number;
    };
}, {
    data: {
        message: string;
        count: number;
    };
}>;
export declare const Get_messages_unread_count_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        count: number;
    }, {
        count: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        count: number;
    };
}, {
    data: {
        count: number;
    };
}>;
export declare const Get_messages_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        senderId: z.ZodString;
        content: z.ZodString;
        mediaUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mediaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mediaFilename: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        replyToMessageId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        replyPreview: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        readAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }, {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_messages_RequestBodySchema: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    mediaUrl: z.ZodOptional<z.ZodString>;
    mediaType: z.ZodOptional<z.ZodString>;
    mediaFilename: z.ZodOptional<z.ZodString>;
    replyToMessageId: z.ZodOptional<z.ZodString>;
    replyPreview: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    content?: string | undefined;
    mediaUrl?: string | undefined;
    mediaType?: string | undefined;
    mediaFilename?: string | undefined;
    replyToMessageId?: string | undefined;
    replyPreview?: string | undefined;
}, {
    conversationId: string;
    content?: string | undefined;
    mediaUrl?: string | undefined;
    mediaType?: string | undefined;
    mediaFilename?: string | undefined;
    replyToMessageId?: string | undefined;
    replyPreview?: string | undefined;
}>;
export declare const Post_messages_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        senderId: z.ZodString;
        content: z.ZodString;
        mediaUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mediaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mediaFilename: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        replyToMessageId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        replyPreview: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        readAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }, {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    };
}>;
export declare const Get_messages_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        senderId: z.ZodString;
        content: z.ZodString;
        mediaUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mediaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mediaFilename: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        replyToMessageId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        replyPreview: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        readAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }, {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt: string | null;
        mediaUrl?: string | null | undefined;
        mediaType?: string | null | undefined;
        mediaFilename?: string | null | undefined;
        replyToMessageId?: string | null | undefined;
        replyPreview?: string | null | undefined;
    };
}>;
export declare const Post_messages_id_reactions_RequestBodySchema: z.ZodObject<{
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emoji: string;
}, {
    emoji: string;
}>;
export declare const Post_messages_id_reactions_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        conversationId: z.ZodString;
        messageId: z.ZodString;
        reactions: z.ZodArray<z.ZodObject<{
            emoji: z.ZodString;
            userId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            emoji: string;
        }, {
            userId: string;
            emoji: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        conversationId: string;
        reactions: {
            userId: string;
            emoji: string;
        }[];
        messageId: string;
    }, {
        conversationId: string;
        reactions: {
            userId: string;
            emoji: string;
        }[];
        messageId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        conversationId: string;
        reactions: {
            userId: string;
            emoji: string;
        }[];
        messageId: string;
    };
}, {
    data: {
        conversationId: string;
        reactions: {
            userId: string;
            emoji: string;
        }[];
        messageId: string;
    };
}>;
export declare const Post_polls_RequestBodySchema: z.ZodObject<{
    messageId: z.ZodString;
    groupId: z.ZodString;
    question: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    options: string[];
    groupId: string;
    question: string;
    messageId: string;
    expiresAt: string;
}, {
    options: string[];
    groupId: string;
    question: string;
    messageId: string;
    expiresAt: string;
}>;
export declare const Post_polls_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        pollId: z.ZodString;
        messageId: z.ZodString;
        groupId: z.ZodString;
        createdBy: z.ZodString;
        question: z.ZodString;
        options: z.ZodArray<z.ZodString, "many">;
        expiresAt: z.ZodString;
        status: z.ZodEnum<["active", "closed"]>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        results: z.ZodArray<z.ZodObject<{
            option: z.ZodString;
            count: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            count: number;
            option: string;
            percentage: number;
        }, {
            count: number;
            option: string;
            percentage: number;
        }>, "many">;
        totalVotes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        options: string[];
        status: "active" | "closed";
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        groupId: string;
        question: string;
        messageId: string;
        expiresAt: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    }, {
        options: string[];
        status: "active" | "closed";
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        groupId: string;
        question: string;
        messageId: string;
        expiresAt: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        options: string[];
        status: "active" | "closed";
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        groupId: string;
        question: string;
        messageId: string;
        expiresAt: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    };
}, {
    data: {
        options: string[];
        status: "active" | "closed";
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        groupId: string;
        question: string;
        messageId: string;
        expiresAt: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    };
}>;
export declare const Post_polls_pollId_votes_RequestBodySchema: z.ZodObject<{
    selectedOption: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    selectedOption: number;
}, {
    selectedOption: number;
}>;
export declare const Post_polls_pollId_votes_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        success: z.ZodBoolean;
        pollId: z.ZodString;
        userId: z.ZodString;
        selectedOption: z.ZodNumber;
        results: z.ZodArray<z.ZodObject<{
            option: z.ZodString;
            count: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            count: number;
            option: string;
            percentage: number;
        }, {
            count: number;
            option: string;
            percentage: number;
        }>, "many">;
        totalVotes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        success: boolean;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
        selectedOption: number;
    }, {
        userId: string;
        success: boolean;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
        selectedOption: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        userId: string;
        success: boolean;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
        selectedOption: number;
    };
}, {
    data: {
        userId: string;
        success: boolean;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
        selectedOption: number;
    };
}>;
export declare const Post_polls_pollId_votes_400ResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
    code: string;
    success: false;
}, {
    error: string;
    code: string;
    success: false;
}>;
export declare const Get_polls_pollId_results_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        pollId: z.ZodString;
        question: z.ZodString;
        status: z.ZodEnum<["active", "closed"]>;
        results: z.ZodArray<z.ZodObject<{
            option: z.ZodString;
            count: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            count: number;
            option: string;
            percentage: number;
        }, {
            count: number;
            option: string;
            percentage: number;
        }>, "many">;
        totalVotes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "closed";
        question: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    }, {
        status: "active" | "closed";
        question: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "active" | "closed";
        question: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    };
}, {
    data: {
        status: "active" | "closed";
        question: string;
        pollId: string;
        results: {
            count: number;
            option: string;
            percentage: number;
        }[];
        totalVotes: number;
    };
}>;
export declare const Get_students_me_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}>;
export declare const Patch_students_me_RequestBodySchema: z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    phone_number: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    bio?: string | undefined;
    avatar_url?: string | undefined;
    full_name?: string | undefined;
    semester?: number | undefined;
    phone_number?: string | undefined;
}, {
    bio?: string | undefined;
    avatar_url?: string | undefined;
    full_name?: string | undefined;
    semester?: number | undefined;
    phone_number?: string | undefined;
}>;
export declare const Patch_students_me_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}>;
export declare const Post_students_profile_RequestBodySchema: z.ZodObject<{
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fullName: string;
}, {
    fullName: string;
}>;
export declare const Post_students_profile_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}>;
export declare const Patch_students_me_primary_program_RequestBodySchema: z.ZodObject<{
    program_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    program_id: string;
}, {
    program_id: string;
}>;
export declare const Patch_students_me_primary_program_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}>;
export declare const Get_students_me_programs_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyId: z.ZodOptional<z.ZodString>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_students_me_subjects_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        credits: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_students_me_subjects_RequestBodySchema: z.ZodObject<{
    subject_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    subject_id: string;
}, {
    subject_id: string;
}>;
export declare const Post_students_me_avatar_RequestBodySchema: z.ZodObject<{
    image: z.ZodString;
    user_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    image: string;
    user_id?: string | undefined;
}, {
    image: string;
    user_id?: string | undefined;
}>;
export declare const Post_students_me_avatar_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        url: string;
    };
}, {
    data: {
        url: string;
    };
}>;
export declare const Get_students_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_students_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}>;
export declare const Get_catalog_subjects_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        credits: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_catalog_programs_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyId: z.ZodOptional<z.ZodString>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        facultyId?: string | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        isPrimary?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_catalog_programs_programId_subjects_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        credits: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }, {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        name: string;
        code?: string | null | undefined;
        createdAt?: string | undefined;
        credits?: number | null | undefined;
        semester?: number | null | undefined;
        isActive?: boolean | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_perfil_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        fullName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodString>;
        semester: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        programId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        programName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        facultyName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        carrera: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        asignaturasActivas: z.ZodOptional<z.ZodAny>;
        indicadores: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        insignias: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }, {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}, {
    data: {
        id: string;
        fullName: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        role?: string | undefined;
        bio?: string | null | undefined;
        programId?: string | null | undefined;
        avatarUrl?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        semester?: number | null | undefined;
        programName?: string | null | undefined;
        facultyName?: string | null | undefined;
        isActive?: boolean | undefined;
        carrera?: any;
        asignaturasActivas?: any;
        indicadores?: any;
        insignias?: any;
    };
}>;
export declare const Get_resources_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        resourceType: z.ZodOptional<z.ZodEnum<["file", "link"]>>;
        url: z.ZodOptional<z.ZodString>;
        fileUrl: z.ZodOptional<z.ZodString>;
        fileName: z.ZodOptional<z.ZodString>;
        fileType: z.ZodOptional<z.ZodString>;
        fileSizeKb: z.ZodOptional<z.ZodNumber>;
        subjectId: z.ZodOptional<z.ZodString>;
        programId: z.ZodOptional<z.ZodString>;
        userId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_resources_RequestBodySchema: z.ZodObject<{
    resourceType: z.ZodOptional<z.ZodEnum<["file", "link"]>>;
    programId: z.ZodOptional<z.ZodString>;
    subjectId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodOptional<z.ZodString>;
    fileName: z.ZodOptional<z.ZodString>;
    fileType: z.ZodOptional<z.ZodString>;
    fileSizeKb: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    programId?: string | undefined;
    subjectId?: string | undefined;
    url?: string | undefined;
    fileUrl?: string | undefined;
    fileName?: string | undefined;
    fileType?: string | undefined;
    fileSizeKb?: number | undefined;
    resourceType?: "file" | "link" | undefined;
}, {
    title: string;
    description?: string | undefined;
    programId?: string | undefined;
    subjectId?: string | undefined;
    url?: string | undefined;
    fileUrl?: string | undefined;
    fileName?: string | undefined;
    fileType?: string | undefined;
    fileSizeKb?: number | undefined;
    resourceType?: "file" | "link" | undefined;
}>;
export declare const Post_resources_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        resourceType: z.ZodOptional<z.ZodEnum<["file", "link"]>>;
        url: z.ZodOptional<z.ZodString>;
        fileUrl: z.ZodOptional<z.ZodString>;
        fileName: z.ZodOptional<z.ZodString>;
        fileType: z.ZodOptional<z.ZodString>;
        fileSizeKb: z.ZodOptional<z.ZodNumber>;
        subjectId: z.ZodOptional<z.ZodString>;
        programId: z.ZodOptional<z.ZodString>;
        userId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    };
}>;
export declare const Get_resources_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        resourceType: z.ZodOptional<z.ZodEnum<["file", "link"]>>;
        url: z.ZodOptional<z.ZodString>;
        fileUrl: z.ZodOptional<z.ZodString>;
        fileName: z.ZodOptional<z.ZodString>;
        fileType: z.ZodOptional<z.ZodString>;
        fileSizeKb: z.ZodOptional<z.ZodNumber>;
        subjectId: z.ZodOptional<z.ZodString>;
        programId: z.ZodOptional<z.ZodString>;
        userId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    };
}>;
export declare const Put_resources_id_RequestBodySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string | null | undefined;
    title?: string | undefined;
}, {
    description?: string | null | undefined;
    title?: string | undefined;
}>;
export declare const Put_resources_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        resourceType: z.ZodOptional<z.ZodEnum<["file", "link"]>>;
        url: z.ZodOptional<z.ZodString>;
        fileUrl: z.ZodOptional<z.ZodString>;
        fileName: z.ZodOptional<z.ZodString>;
        fileType: z.ZodOptional<z.ZodString>;
        fileSizeKb: z.ZodOptional<z.ZodNumber>;
        subjectId: z.ZodOptional<z.ZodString>;
        programId: z.ZodOptional<z.ZodString>;
        userId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    };
}, {
    data: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        title: string;
        description?: string | null | undefined;
        programId?: string | undefined;
        subjectId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
    };
}>;
export declare const Get_study_groups_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        subject: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            programId: z.ZodString;
            code: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            credits: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }>;
        subjectId: z.ZodString;
        status: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
        maxMembers: z.ZodNumber;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        memberCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_study_groups_RequestBodySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    subjectId: z.ZodString;
    maxMembers: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    subjectId: string;
    maxMembers: number;
}, {
    name: string;
    description: string;
    subjectId: string;
    maxMembers: number;
}>;
export declare const Post_study_groups_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        subject: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            programId: z.ZodString;
            code: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            credits: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }>;
        subjectId: z.ZodString;
        status: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
        maxMembers: z.ZodNumber;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        memberCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    };
}, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    };
}>;
export declare const Get_study_groups_me_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        subject: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            programId: z.ZodString;
            code: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            credits: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }>;
        subjectId: z.ZodString;
        status: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
        maxMembers: z.ZodNumber;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        memberCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_study_groups_applications_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        userId: z.ZodString;
        status: z.ZodEnum<["pending", "approved", "rejected"]>;
        message: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }, {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_study_groups_id_200ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        subject: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            programId: z.ZodString;
            code: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            credits: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }>;
        subjectId: z.ZodString;
        status: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
        maxMembers: z.ZodNumber;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        memberCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    };
}, {
    data: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    };
}>;
export declare const Get_study_groups_id_members_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        groupId: z.ZodString;
        role: z.ZodEnum<["admin", "member"]>;
        joinedAt: z.ZodString;
        profile: z.ZodOptional<z.ZodObject<{
            fullName: z.ZodString;
            avatarUrl: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            avatarUrl: string | null;
            fullName: string;
        }, {
            avatarUrl: string | null;
            fullName: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        role: "admin" | "member";
        userId: string;
        groupId: string;
        joinedAt: string;
        profile?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    }, {
        id: string;
        role: "admin" | "member";
        userId: string;
        groupId: string;
        joinedAt: string;
        profile?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        role: "admin" | "member";
        userId: string;
        groupId: string;
        joinedAt: string;
        profile?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        id: string;
        role: "admin" | "member";
        userId: string;
        groupId: string;
        joinedAt: string;
        profile?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_study_groups_id_applications_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        userId: z.ZodString;
        status: z.ZodEnum<["pending", "approved", "rejected"]>;
        message: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }, {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        status: "pending" | "approved" | "rejected";
        createdAt: string;
        id: string;
        userId: string;
        groupId: string;
        message?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_study_groups_id_messages_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        senderId: z.ZodString;
        content: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    }, {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_study_groups_id_messages_RequestBodySchema: z.ZodObject<{
    content: z.ZodString;
    mediaUrl: z.ZodOptional<z.ZodString>;
    mediaType: z.ZodOptional<z.ZodString>;
    mediaFilename: z.ZodOptional<z.ZodString>;
    mentions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    mentions?: string[] | undefined;
    mediaUrl?: string | undefined;
    mediaType?: string | undefined;
    mediaFilename?: string | undefined;
}, {
    content: string;
    mentions?: string[] | undefined;
    mediaUrl?: string | undefined;
    mediaType?: string | undefined;
    mediaFilename?: string | undefined;
}>;
export declare const Post_study_groups_id_messages_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        senderId: z.ZodString;
        content: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    }, {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        groupId: string;
        senderId: string;
        content: string;
    };
}>;
export declare const Post_study_groups_id_apply_RequestBodySchema: z.ZodObject<{
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string | undefined;
}, {
    message?: string | undefined;
}>;
export declare const Post_study_groups_id_transfer_RequestBodySchema: z.ZodObject<{
    targetUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetUserId: string;
}, {
    targetUserId: string;
}>;
export declare const Put_study_groups_applications_applicationId_review_RequestBodySchema: z.ZodObject<{
    status: z.ZodEnum<["aceptada", "rechazada"]>;
}, "strip", z.ZodTypeAny, {
    status: "aceptada" | "rechazada";
}, {
    status: "aceptada" | "rechazada";
}>;
export declare const Post_study_groups_id_messages_messageId_reactions_RequestBodySchema: z.ZodObject<{
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emoji: string;
}, {
    emoji: string;
}>;
export declare const Get_study_groups_id_sessions_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        dateTime: z.ZodString;
        durationMinutes: z.ZodNumber;
        location: z.ZodOptional<z.ZodString>;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    }, {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Post_study_groups_id_sessions_RequestBodySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dateTime: z.ZodString;
    durationMinutes: z.ZodNumber;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    dateTime: string;
    durationMinutes: number;
    description?: string | undefined;
    location?: string | undefined;
}, {
    title: string;
    dateTime: string;
    durationMinutes: number;
    description?: string | undefined;
    location?: string | undefined;
}>;
export declare const Post_study_groups_id_sessions_201ResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        dateTime: z.ZodString;
        durationMinutes: z.ZodNumber;
        location: z.ZodOptional<z.ZodString>;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    }, {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    };
}, {
    data: {
        createdAt: string;
        id: string;
        createdBy: string;
        groupId: string;
        title: string;
        dateTime: string;
        durationMinutes: number;
        description?: string | undefined;
        location?: string | undefined;
    };
}>;
export declare const Post_study_groups_id_sessions_sessionId_availability_RequestBodySchema: z.ZodObject<{
    status: z.ZodEnum<["confirmed", "declined"]>;
}, "strip", z.ZodTypeAny, {
    status: "confirmed" | "declined";
}, {
    status: "confirmed" | "declined";
}>;
export declare const Get_study_groups_id_sessions_sessionId_attendees_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        userName: z.ZodString;
        available: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        userName: string;
        available: boolean;
    }, {
        userId: string;
        userName: string;
        available: boolean;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        userId: string;
        userName: string;
        available: boolean;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        userId: string;
        userName: string;
        available: boolean;
    }[];
    meta: {
        total: number;
    };
}>;
export declare const Get_notifications_200ResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        read: z.ZodBoolean;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        createdAt: string;
        id: string;
        userId: string;
        title: string;
        read: boolean;
        body: string;
    }, {
        type: string;
        createdAt: string;
        id: string;
        userId: string;
        title: string;
        read: boolean;
        body: string;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        type: string;
        createdAt: string;
        id: string;
        userId: string;
        title: string;
        read: boolean;
        body: string;
    }[];
    meta: {
        total: number;
    };
}, {
    data: {
        type: string;
        createdAt: string;
        id: string;
        userId: string;
        title: string;
        read: boolean;
        body: string;
    }[];
    meta: {
        total: number;
    };
}>;
//# sourceMappingURL=zod.d.ts.map