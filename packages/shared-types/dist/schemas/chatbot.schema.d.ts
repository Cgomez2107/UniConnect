import { z } from "zod";
export declare const ChatbotMessageRequestSchema: z.ZodObject<{
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
export declare const ChatbotMessageResponseSchema: z.ZodObject<{
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
//# sourceMappingURL=chatbot.schema.d.ts.map