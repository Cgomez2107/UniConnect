import { z } from "zod";
import type { ApiContract } from "./_base.contract";
export declare const CreateConversationRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        type: z.ZodEnum<["direct", "group"]>;
        name: z.ZodOptional<z.ZodString>;
        participantIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "direct" | "group";
        participantIds: string[];
        name?: string | undefined;
    }, {
        type: "direct" | "group";
        participantIds: string[];
        name?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type: "direct" | "group";
        participantIds: string[];
        name?: string | undefined;
    };
}, {
    body: {
        type: "direct" | "group";
        participantIds: string[];
        name?: string | undefined;
    };
}>;
export declare const CreateConversationResponseSchema: z.ZodObject<{
    conversation: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    conversation: {
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
    };
}, {
    conversation: {
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
    };
}>;
export declare const SendMessageRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        conversationId: z.ZodString;
        content: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>>;
        poll: z.ZodOptional<z.ZodObject<{
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                text: z.ZodString;
                votes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            }, "strip", z.ZodTypeAny, {
                text: string;
                votes: string[];
            }, {
                text: string;
                votes?: string[] | undefined;
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
                votes?: string[] | undefined;
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        conversationId: string;
        content: string;
        poll?: {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | undefined;
    }, {
        conversationId: string;
        content: string;
        type?: "text" | "file" | "mention" | "reaction" | "poll" | undefined;
        poll?: {
            options: {
                text: string;
                votes?: string[] | undefined;
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        conversationId: string;
        content: string;
        poll?: {
            options: {
                text: string;
                votes: string[];
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | undefined;
    };
}, {
    body: {
        conversationId: string;
        content: string;
        type?: "text" | "file" | "mention" | "reaction" | "poll" | undefined;
        poll?: {
            options: {
                text: string;
                votes?: string[] | undefined;
            }[];
            createdAt: string;
            question: string;
            isOpen: boolean;
            closesAt: string | null;
        } | undefined;
    };
}>;
export declare const SendMessageResponseSchema: z.ZodObject<{
    message: z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        senderId: z.ZodString;
        content: z.ZodString;
        type: z.ZodEnum<["text", "file", "mention", "reaction", "poll"]>;
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
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
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
    }, {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
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
    }>;
}, "strip", z.ZodTypeAny, {
    message: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
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
    };
}, {
    message: {
        type: "text" | "file" | "mention" | "reaction" | "poll";
        createdAt: string;
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
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
    };
}>;
export declare const CreateConversationContract: ApiContract<typeof CreateConversationRequestSchema, typeof CreateConversationResponseSchema>;
export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type CreateConversationResponse = z.infer<typeof CreateConversationResponseSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
//# sourceMappingURL=messaging.contract.d.ts.map