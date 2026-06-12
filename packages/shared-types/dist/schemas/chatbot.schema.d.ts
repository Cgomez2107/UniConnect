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
}, "strip", z.ZodTypeAny, {
    reply: string;
}, {
    reply: string;
}>;
//# sourceMappingURL=chatbot.schema.d.ts.map