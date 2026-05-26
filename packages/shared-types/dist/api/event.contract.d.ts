import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";
export declare const CreateEventRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        eventDate: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        category: z.ZodDefault<z.ZodEnum<["academico", "cultural", "deportivo", "otro"]>>;
        capacity: z.ZodOptional<z.ZodNumber>;
        isOnline: z.ZodDefault<z.ZodBoolean>;
        eventUrl: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        eventDate: string;
        category: "academico" | "cultural" | "deportivo" | "otro";
        isOnline: boolean;
        location?: string | undefined;
        capacity?: number | undefined;
        eventUrl?: string | undefined;
        tags?: string[] | undefined;
    }, {
        description: string;
        title: string;
        eventDate: string;
        location?: string | undefined;
        category?: "academico" | "cultural" | "deportivo" | "otro" | undefined;
        capacity?: number | undefined;
        isOnline?: boolean | undefined;
        eventUrl?: string | undefined;
        tags?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        description: string;
        title: string;
        eventDate: string;
        category: "academico" | "cultural" | "deportivo" | "otro";
        isOnline: boolean;
        location?: string | undefined;
        capacity?: number | undefined;
        eventUrl?: string | undefined;
        tags?: string[] | undefined;
    };
}, {
    body: {
        description: string;
        title: string;
        eventDate: string;
        location?: string | undefined;
        category?: "academico" | "cultural" | "deportivo" | "otro" | undefined;
        capacity?: number | undefined;
        isOnline?: boolean | undefined;
        eventUrl?: string | undefined;
        tags?: string[] | undefined;
    };
}>;
export declare const CreateEventResponseSchema: z.ZodObject<{
    event: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        eventDate: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        category: z.ZodEnum<["academico", "cultural", "deportivo", "otro"]>;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodObject<{
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
        capacity: z.ZodOptional<z.ZodNumber>;
        attendeeCount: z.ZodNumber;
        isOnline: z.ZodBoolean;
        eventUrl: z.ZodOptional<z.ZodString>;
        tags: z.ZodArray<z.ZodString, "many">;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string;
        title: string;
        eventDate: string;
        category: "academico" | "cultural" | "deportivo" | "otro";
        creatorId: string;
        attendeeCount: number;
        isOnline: boolean;
        tags: string[];
        location?: string | undefined;
        creator?: {
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
        capacity?: number | undefined;
        eventUrl?: string | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string;
        title: string;
        eventDate: string;
        category: "academico" | "cultural" | "deportivo" | "otro";
        creatorId: string;
        attendeeCount: number;
        isOnline: boolean;
        tags: string[];
        location?: string | undefined;
        creator?: {
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
        capacity?: number | undefined;
        eventUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    event: {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string;
        title: string;
        eventDate: string;
        category: "academico" | "cultural" | "deportivo" | "otro";
        creatorId: string;
        attendeeCount: number;
        isOnline: boolean;
        tags: string[];
        location?: string | undefined;
        creator?: {
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
        capacity?: number | undefined;
        eventUrl?: string | undefined;
    };
}, {
    event: {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string;
        title: string;
        eventDate: string;
        category: "academico" | "cultural" | "deportivo" | "otro";
        creatorId: string;
        attendeeCount: number;
        isOnline: boolean;
        tags: string[];
        location?: string | undefined;
        creator?: {
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
        capacity?: number | undefined;
        eventUrl?: string | undefined;
    };
}>;
export declare const CreateEventContract: ApiContract<typeof CreateEventRequestSchema, typeof CreateEventResponseSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type CreateEventResponse = z.infer<typeof CreateEventResponseSchema>;
//# sourceMappingURL=event.contract.d.ts.map