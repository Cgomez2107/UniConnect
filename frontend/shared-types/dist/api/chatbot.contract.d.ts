import { z } from "zod";
import type { ApiContract } from "./_base.contract";
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
}, "strip", z.ZodTypeAny, {
    reply: string;
}, {
    reply: string;
}>;
export declare const SendChatbotMessageContract: ApiContract<typeof SendChatbotMessageRequestSchema, typeof SendChatbotMessageResponseSchema>;
export type SendChatbotMessageRequest = z.infer<typeof SendChatbotMessageRequestSchema>;
export type SendChatbotMessageResponse = z.infer<typeof SendChatbotMessageResponseSchema>;
//# sourceMappingURL=chatbot.contract.d.ts.map