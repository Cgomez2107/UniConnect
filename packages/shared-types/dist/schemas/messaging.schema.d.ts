import { z } from "zod";
export declare const ConversationTypeEnum: z.ZodEnum<["direct", "group"]>;
export declare const MessageTypeEnum: z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>;
export declare const PollOptionSchema: z.ZodObject<{
    text: z.ZodString;
    votes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    text: string;
    votes: string[];
}, {
    text: string;
    votes: string[];
}>;
export declare const PollOptionDTOSchema: z.ZodObject<{
    text: z.ZodString;
    votes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    text: string;
    votes: string[];
}, {
    text: string;
    votes: string[];
}>;
export declare const PollDataSchema: z.ZodObject<{
    question: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        votes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        votes: string[];
    }, {
        text: string;
        votes: string[];
    }>, "many">;
    isOpen: z.ZodBoolean;
    closesAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    options: {
        text: string;
        votes: string[];
    }[];
    createdAt: string;
    question: string;
    isOpen: boolean;
    closesAt: string | null;
}, {
    options: {
        text: string;
        votes: string[];
    }[];
    createdAt: string;
    question: string;
    isOpen: boolean;
    closesAt: string | null;
}>;
export declare const PollDataDTOSchema: z.ZodObject<{
    question: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        votes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        text: string;
        votes: string[];
    }, {
        text: string;
        votes: string[];
    }>, "many">;
    is_open: z.ZodBoolean;
    closes_at: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    options: {
        text: string;
        votes: string[];
    }[];
    created_at: string;
    question: string;
    is_open: boolean;
    closes_at: string | null;
}, {
    options: {
        text: string;
        votes: string[];
    }[];
    created_at: string;
    question: string;
    is_open: boolean;
    closes_at: string | null;
}>;
export declare const PollVoteRequestSchema: z.ZodObject<{
    optionIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    optionIndex: number;
}, {
    optionIndex: number;
}>;
export declare const MessageDecorationSchema: z.ZodObject<{
    type: z.ZodEnum<["mention", "file", "reaction", "poll"]>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: "file" | "mention" | "reaction" | "poll";
    data: Record<string, any>;
}, {
    type: "file" | "mention" | "reaction" | "poll";
    data: Record<string, any>;
}>;
export declare const MessageDecorationDTOSchema: z.ZodObject<{
    type: z.ZodEnum<["mention", "file", "reaction", "poll"]>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: "file" | "mention" | "reaction" | "poll";
    data: Record<string, any>;
}, {
    type: "file" | "mention" | "reaction" | "poll";
    data: Record<string, any>;
}>;
export declare const MessageAttachmentSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    url: z.ZodString;
    name: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
}, {
    type: string;
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
}>;
export declare const MessageAttachmentDTOSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    url: z.ZodString;
    name: z.ZodString;
    size: z.ZodNumber;
    mime_type: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    name: string;
    url: string;
    size: number;
    mime_type: string;
}, {
    type: string;
    id: string;
    name: string;
    url: string;
    size: number;
    mime_type: string;
}>;
export declare const MessageReactionSchema: z.ZodObject<{
    id: z.ZodString;
    emoji: z.ZodString;
    userId: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profileImageUrl: z.ZodOptional<z.ZodString>;
        isVerified: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    userId: string;
    emoji: string;
    user?: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    } | undefined;
}, {
    createdAt: string;
    id: string;
    userId: string;
    emoji: string;
    user?: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    } | undefined;
}>;
export declare const MessageReactionDTOSchema: z.ZodObject<{
    id: z.ZodString;
    emoji: z.ZodString;
    user_id: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        first_name: z.ZodString;
        last_name: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profile_image_url: z.ZodOptional<z.ZodString>;
        is_verified: z.ZodBoolean;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    user_id: string;
    emoji: string;
    user?: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    } | undefined;
}, {
    id: string;
    created_at: string;
    user_id: string;
    emoji: string;
    user?: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    } | undefined;
}>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    conversationId: z.ZodString;
    senderId: z.ZodString;
    sender: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profileImageUrl: z.ZodOptional<z.ZodString>;
        isVerified: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }>>;
    content: z.ZodString;
    type: z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>;
    decorations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["mention", "file", "reaction", "poll"]>;
        data: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }, {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }>, "many">>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        url: z.ZodString;
        name: z.ZodString;
        size: z.ZodNumber;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mimeType: string;
    }, {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mimeType: string;
    }>, "many">>;
    reactions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        emoji: z.ZodString;
        userId: z.ZodString;
        user: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profileImageUrl: z.ZodOptional<z.ZodString>;
            isVerified: z.ZodBoolean;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        }, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        }>>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        id: string;
        userId: string;
        emoji: string;
        user?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    }, {
        createdAt: string;
        id: string;
        userId: string;
        emoji: string;
        user?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    }>, "many">>;
    poll: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        question: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            votes: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            votes: string[];
        }, {
            text: string;
            votes: string[];
        }>, "many">;
        isOpen: z.ZodBoolean;
        closesAt: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        options: {
            text: string;
            votes: string[];
        }[];
        createdAt: string;
        question: string;
        isOpen: boolean;
        closesAt: string | null;
    }, {
        options: {
            text: string;
            votes: string[];
        }[];
        createdAt: string;
        question: string;
        isOpen: boolean;
        closesAt: string | null;
    }>>>;
    isEdited: z.ZodBoolean;
    editedAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text" | "file" | "mention" | "reaction" | "poll";
    createdAt: string;
    updatedAt: string;
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isEdited: boolean;
    poll?: {
        options: {
            text: string;
            votes: string[];
        }[];
        createdAt: string;
        question: string;
        isOpen: boolean;
        closesAt: string | null;
    } | null | undefined;
    sender?: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    } | undefined;
    decorations?: {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }[] | undefined;
    attachments?: {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mimeType: string;
    }[] | undefined;
    reactions?: {
        createdAt: string;
        id: string;
        userId: string;
        emoji: string;
        user?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    }[] | undefined;
    editedAt?: string | undefined;
}, {
    type: "text" | "file" | "mention" | "reaction" | "poll";
    createdAt: string;
    updatedAt: string;
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isEdited: boolean;
    poll?: {
        options: {
            text: string;
            votes: string[];
        }[];
        createdAt: string;
        question: string;
        isOpen: boolean;
        closesAt: string | null;
    } | null | undefined;
    sender?: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    } | undefined;
    decorations?: {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }[] | undefined;
    attachments?: {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mimeType: string;
    }[] | undefined;
    reactions?: {
        createdAt: string;
        id: string;
        userId: string;
        emoji: string;
        user?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    }[] | undefined;
    editedAt?: string | undefined;
}>;
export declare const MessageDTOSchema: z.ZodObject<{
    id: z.ZodString;
    conversation_id: z.ZodString;
    sender_id: z.ZodString;
    sender: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        first_name: z.ZodString;
        last_name: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profile_image_url: z.ZodOptional<z.ZodString>;
        is_verified: z.ZodBoolean;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }>>;
    content: z.ZodString;
    type: z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>;
    decorations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["mention", "file", "reaction", "poll"]>;
        data: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }, {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }>, "many">>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        url: z.ZodString;
        name: z.ZodString;
        size: z.ZodNumber;
        mime_type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mime_type: string;
    }, {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mime_type: string;
    }>, "many">>;
    reactions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        emoji: z.ZodString;
        user_id: z.ZodString;
        user: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            first_name: z.ZodString;
            last_name: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profile_image_url: z.ZodOptional<z.ZodString>;
            is_verified: z.ZodBoolean;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        }, {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        }>>;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        user_id: string;
        emoji: string;
        user?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
    }, {
        id: string;
        created_at: string;
        user_id: string;
        emoji: string;
        user?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
    }>, "many">>;
    poll_data: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        question: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            votes: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            text: string;
            votes: string[];
        }, {
            text: string;
            votes: string[];
        }>, "many">;
        is_open: z.ZodBoolean;
        closes_at: z.ZodNullable<z.ZodString>;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        options: {
            text: string;
            votes: string[];
        }[];
        created_at: string;
        question: string;
        is_open: boolean;
        closes_at: string | null;
    }, {
        options: {
            text: string;
            votes: string[];
        }[];
        created_at: string;
        question: string;
        is_open: boolean;
        closes_at: string | null;
    }>>>;
    is_edited: z.ZodBoolean;
    edited_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text" | "file" | "mention" | "reaction" | "poll";
    id: string;
    created_at: string;
    updated_at: string;
    content: string;
    conversation_id: string;
    sender_id: string;
    is_edited: boolean;
    sender?: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    } | undefined;
    decorations?: {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }[] | undefined;
    attachments?: {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mime_type: string;
    }[] | undefined;
    reactions?: {
        id: string;
        created_at: string;
        user_id: string;
        emoji: string;
        user?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
    }[] | undefined;
    poll_data?: {
        options: {
            text: string;
            votes: string[];
        }[];
        created_at: string;
        question: string;
        is_open: boolean;
        closes_at: string | null;
    } | null | undefined;
    edited_at?: string | undefined;
}, {
    type: "text" | "file" | "mention" | "reaction" | "poll";
    id: string;
    created_at: string;
    updated_at: string;
    content: string;
    conversation_id: string;
    sender_id: string;
    is_edited: boolean;
    sender?: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    } | undefined;
    decorations?: {
        type: "file" | "mention" | "reaction" | "poll";
        data: Record<string, any>;
    }[] | undefined;
    attachments?: {
        type: string;
        id: string;
        name: string;
        url: string;
        size: number;
        mime_type: string;
    }[] | undefined;
    reactions?: {
        id: string;
        created_at: string;
        user_id: string;
        emoji: string;
        user?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
    }[] | undefined;
    poll_data?: {
        options: {
            text: string;
            votes: string[];
        }[];
        created_at: string;
        question: string;
        is_open: boolean;
        closes_at: string | null;
    } | null | undefined;
    edited_at?: string | undefined;
}>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["direct", "group"]>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    participants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profileImageUrl: z.ZodOptional<z.ZodString>;
        isVerified: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }>, "many">;
    lastMessage: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        senderId: z.ZodString;
        sender: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profileImageUrl: z.ZodOptional<z.ZodString>;
            isVerified: z.ZodBoolean;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        }, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        }>>;
        content: z.ZodString;
        type: z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>;
        decorations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["mention", "file", "reaction", "poll"]>;
            data: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }, {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }>, "many">>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodString;
            name: z.ZodString;
            size: z.ZodNumber;
            mimeType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mimeType: string;
        }, {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mimeType: string;
        }>, "many">>;
        reactions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emoji: z.ZodString;
            userId: z.ZodString;
            user: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                email: z.ZodString;
                firstName: z.ZodString;
                lastName: z.ZodString;
                role: z.ZodEnum<["estudiante", "admin"]>;
                profileImageUrl: z.ZodOptional<z.ZodString>;
                isVerified: z.ZodBoolean;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            }, {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            }>>;
            createdAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            createdAt: string;
            id: string;
            userId: string;
            emoji: string;
            user?: {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            } | undefined;
        }, {
            createdAt: string;
            id: string;
            userId: string;
            emoji: string;
            user?: {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            } | undefined;
        }>, "many">>;
        poll: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                text: z.ZodString;
                votes: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                votes: string[];
            }, {
                text: string;
                votes: string[];
            }>, "many">;
            isOpen: z.ZodBoolean;
            closesAt: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        }, {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        }>>>;
        isEdited: z.ZodBoolean;
        editedAt: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        updatedAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        isEdited: boolean;
        poll?: {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | null | undefined;
        sender?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mimeType: string;
        }[] | undefined;
        reactions?: {
            createdAt: string;
            id: string;
            userId: string;
            emoji: string;
            user?: {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            } | undefined;
        }[] | undefined;
        editedAt?: string | undefined;
    }, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        updatedAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        isEdited: boolean;
        poll?: {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | null | undefined;
        sender?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mimeType: string;
        }[] | undefined;
        reactions?: {
            createdAt: string;
            id: string;
            userId: string;
            emoji: string;
            user?: {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            } | undefined;
        }[] | undefined;
        editedAt?: string | undefined;
    }>>;
    lastMessageAt: z.ZodOptional<z.ZodString>;
    messageCount: z.ZodNumber;
    unreadCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "direct" | "group";
    createdAt: string;
    updatedAt: string;
    id: string;
    participants: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }[];
    messageCount: number;
    unreadCount: number;
    name?: string | undefined;
    description?: string | undefined;
    avatarUrl?: string | undefined;
    lastMessage?: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        updatedAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        isEdited: boolean;
        poll?: {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | null | undefined;
        sender?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mimeType: string;
        }[] | undefined;
        reactions?: {
            createdAt: string;
            id: string;
            userId: string;
            emoji: string;
            user?: {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            } | undefined;
        }[] | undefined;
        editedAt?: string | undefined;
    } | undefined;
    lastMessageAt?: string | undefined;
}, {
    type: "direct" | "group";
    createdAt: string;
    updatedAt: string;
    id: string;
    participants: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    }[];
    messageCount: number;
    unreadCount: number;
    name?: string | undefined;
    description?: string | undefined;
    avatarUrl?: string | undefined;
    lastMessage?: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        updatedAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        isEdited: boolean;
        poll?: {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | null | undefined;
        sender?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mimeType: string;
        }[] | undefined;
        reactions?: {
            createdAt: string;
            id: string;
            userId: string;
            emoji: string;
            user?: {
                email: string;
                createdAt: string;
                updatedAt: string;
                id: string;
                firstName: string;
                lastName: string;
                role: "estudiante" | "admin";
                isVerified: boolean;
                profileImageUrl?: string | undefined;
            } | undefined;
        }[] | undefined;
        editedAt?: string | undefined;
    } | undefined;
    lastMessageAt?: string | undefined;
}>;
export declare const ConversationDTOSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["direct", "group"]>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    participants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        first_name: z.ZodString;
        last_name: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profile_image_url: z.ZodOptional<z.ZodString>;
        is_verified: z.ZodBoolean;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }>, "many">;
    last_message: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        conversation_id: z.ZodString;
        sender_id: z.ZodString;
        sender: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            first_name: z.ZodString;
            last_name: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profile_image_url: z.ZodOptional<z.ZodString>;
            is_verified: z.ZodBoolean;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        }, {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        }>>;
        content: z.ZodString;
        type: z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>;
        decorations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["mention", "file", "reaction", "poll"]>;
            data: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }, {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }>, "many">>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodString;
            name: z.ZodString;
            size: z.ZodNumber;
            mime_type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mime_type: string;
        }, {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mime_type: string;
        }>, "many">>;
        reactions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emoji: z.ZodString;
            user_id: z.ZodString;
            user: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                email: z.ZodString;
                first_name: z.ZodString;
                last_name: z.ZodString;
                role: z.ZodEnum<["estudiante", "admin"]>;
                profile_image_url: z.ZodOptional<z.ZodString>;
                is_verified: z.ZodBoolean;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            }, {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            }>>;
            created_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            user_id: string;
            emoji: string;
            user?: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            } | undefined;
        }, {
            id: string;
            created_at: string;
            user_id: string;
            emoji: string;
            user?: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            } | undefined;
        }>, "many">>;
        poll_data: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                text: z.ZodString;
                votes: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                text: string;
                votes: string[];
            }, {
                text: string;
                votes: string[];
            }>, "many">;
            is_open: z.ZodBoolean;
            closes_at: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            options: {
                text: string;
                votes: string[];
            }[];
            created_at: string;
            question: string;
            is_open: boolean;
            closes_at: string | null;
        }, {
            options: {
                text: string;
                votes: string[];
            }[];
            created_at: string;
            question: string;
            is_open: boolean;
            closes_at: string | null;
        }>>>;
        is_edited: z.ZodBoolean;
        edited_at: z.ZodOptional<z.ZodString>;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        id: string;
        created_at: string;
        updated_at: string;
        content: string;
        conversation_id: string;
        sender_id: string;
        is_edited: boolean;
        sender?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mime_type: string;
        }[] | undefined;
        reactions?: {
            id: string;
            created_at: string;
            user_id: string;
            emoji: string;
            user?: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            } | undefined;
        }[] | undefined;
        poll_data?: {
            options: {
                text: string;
                votes: string[];
            }[];
            created_at: string;
            question: string;
            is_open: boolean;
            closes_at: string | null;
        } | null | undefined;
        edited_at?: string | undefined;
    }, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        id: string;
        created_at: string;
        updated_at: string;
        content: string;
        conversation_id: string;
        sender_id: string;
        is_edited: boolean;
        sender?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mime_type: string;
        }[] | undefined;
        reactions?: {
            id: string;
            created_at: string;
            user_id: string;
            emoji: string;
            user?: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            } | undefined;
        }[] | undefined;
        poll_data?: {
            options: {
                text: string;
                votes: string[];
            }[];
            created_at: string;
            question: string;
            is_open: boolean;
            closes_at: string | null;
        } | null | undefined;
        edited_at?: string | undefined;
    }>>;
    last_message_at: z.ZodOptional<z.ZodString>;
    message_count: z.ZodNumber;
    unread_count: z.ZodNumber;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "direct" | "group";
    id: string;
    created_at: string;
    updated_at: string;
    participants: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }[];
    message_count: number;
    unread_count: number;
    name?: string | undefined;
    description?: string | undefined;
    avatar_url?: string | undefined;
    last_message?: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        id: string;
        created_at: string;
        updated_at: string;
        content: string;
        conversation_id: string;
        sender_id: string;
        is_edited: boolean;
        sender?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mime_type: string;
        }[] | undefined;
        reactions?: {
            id: string;
            created_at: string;
            user_id: string;
            emoji: string;
            user?: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            } | undefined;
        }[] | undefined;
        poll_data?: {
            options: {
                text: string;
                votes: string[];
            }[];
            created_at: string;
            question: string;
            is_open: boolean;
            closes_at: string | null;
        } | null | undefined;
        edited_at?: string | undefined;
    } | undefined;
    last_message_at?: string | undefined;
}, {
    type: "direct" | "group";
    id: string;
    created_at: string;
    updated_at: string;
    participants: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }[];
    message_count: number;
    unread_count: number;
    name?: string | undefined;
    description?: string | undefined;
    avatar_url?: string | undefined;
    last_message?: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        id: string;
        created_at: string;
        updated_at: string;
        content: string;
        conversation_id: string;
        sender_id: string;
        is_edited: boolean;
        sender?: {
            email: string;
            id: string;
            role: "estudiante" | "admin";
            first_name: string;
            last_name: string;
            is_verified: boolean;
            created_at: string;
            updated_at: string;
            profile_image_url?: string | undefined;
        } | undefined;
        decorations?: {
            type: "file" | "mention" | "reaction" | "poll";
            data: Record<string, any>;
        }[] | undefined;
        attachments?: {
            type: string;
            id: string;
            name: string;
            url: string;
            size: number;
            mime_type: string;
        }[] | undefined;
        reactions?: {
            id: string;
            created_at: string;
            user_id: string;
            emoji: string;
            user?: {
                email: string;
                id: string;
                role: "estudiante" | "admin";
                first_name: string;
                last_name: string;
                is_verified: boolean;
                created_at: string;
                updated_at: string;
                profile_image_url?: string | undefined;
            } | undefined;
        }[] | undefined;
        poll_data?: {
            options: {
                text: string;
                votes: string[];
            }[];
            created_at: string;
            question: string;
            is_open: boolean;
            closes_at: string | null;
        } | null | undefined;
        edited_at?: string | undefined;
    } | undefined;
    last_message_at?: string | undefined;
}>;
//# sourceMappingURL=messaging.schema.d.ts.map