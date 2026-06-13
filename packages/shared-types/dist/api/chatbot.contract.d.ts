import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";
export declare const SendChatbotMessageRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        message: z.ZodString;
        history: z.ZodOptional<z.ZodArray<z.ZodObject<{
            role: z.ZodEnum<["user", "assistant"]>;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            role: "user" | "assistant";
            content: string;
        }, {
            role: "user" | "assistant";
            content: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        history?: {
            role: "user" | "assistant";
            content: string;
        }[] | undefined;
    }, {
        message: string;
        history?: {
            role: "user" | "assistant";
            content: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message: string;
        history?: {
            role: "user" | "assistant";
            content: string;
        }[] | undefined;
    };
}, {
    body: {
        message: string;
        history?: {
            role: "user" | "assistant";
            content: string;
        }[] | undefined;
    };
}>;
export declare const SendChatbotMessageResponseSchema: z.ZodObject<{
    reply: z.ZodString;
    referencias: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodString>;
        similarity: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        id?: string | undefined;
        source?: string | undefined;
        similarity?: number | null | undefined;
    }, {
        id?: string | undefined;
        source?: string | undefined;
        similarity?: number | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    reply: string;
    referencias?: {
        id?: string | undefined;
        source?: string | undefined;
        similarity?: number | null | undefined;
    }[] | undefined;
}, {
    reply: string;
    referencias?: {
        id?: string | undefined;
        source?: string | undefined;
        similarity?: number | null | undefined;
    }[] | undefined;
}>;
export declare const SendChatbotMessageContract: ApiContract<typeof SendChatbotMessageRequestSchema, typeof SendChatbotMessageResponseSchema>;
export type SendChatbotMessageRequest = z.infer<typeof SendChatbotMessageRequestSchema>;
export type SendChatbotMessageResponse = z.infer<typeof SendChatbotMessageResponseSchema>;
//# sourceMappingURL=chatbot.contract.d.ts.map