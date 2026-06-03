import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema.js";
export const CreateStudySessionSeriesSchema = z.object({
    groupId: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).default(""),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    rrule: z.string().min(1).max(200).optional(),
    weekCount: z.number().int().positive().max(52).default(8),
});
export const CancelStudySessionSchema = z.object({
    sessionId: UuidSchema,
});
export const StudySessionSchema = z.object({
    id: UuidSchema,
    groupId: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).default(""),
    startTime: DateStringSchema,
    endTime: DateStringSchema,
    rrule: z.string().max(200).optional().nullable(),
    parentSeriesId: UuidSchema.optional().nullable(),
    createdBy: UuidSchema,
    cancelledAt: DateStringSchema.optional().nullable(),
    reminderSentAt: DateStringSchema.optional().nullable(),
    createdAt: DateStringSchema,
    updatedAt: DateStringSchema,
});
export const StudySessionDTOSchema = z.object({
    id: UuidSchema,
    group_id: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).default(""),
    start_time: DateStringSchema,
    end_time: DateStringSchema,
    rrule: z.string().max(200).optional().nullable(),
    parent_series_id: UuidSchema.optional().nullable(),
    created_by: UuidSchema,
    cancelled_at: DateStringSchema.optional().nullable(),
    reminder_sent_at: DateStringSchema.optional().nullable(),
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
});
//# sourceMappingURL=study-session.schema.js.map