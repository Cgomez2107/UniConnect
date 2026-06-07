import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema.js";
export const SessionStatusEnum = z.enum(["scheduled", "cancelled"]);
export const AttendeeStatusEnum = z.enum(["pending", "confirmed", "declined"]);
export const SeriesFrequencyEnum = z.enum(["weekly"]);
export const StudySessionSchema = z.object({
    id: UuidSchema,
    seriesId: UuidSchema.nullable(),
    requestId: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    startTime: DateStringSchema,
    endTime: DateStringSchema,
    location: z.string().max(200).nullable(),
    status: SessionStatusEnum,
    remindAt: DateStringSchema.nullable(),
    reminded: z.boolean(),
    createdBy: UuidSchema,
    createdAt: DateStringSchema,
    updatedAt: DateStringSchema,
});
export const StudySessionDTOSchema = z.object({
    id: UuidSchema,
    series_id: UuidSchema.nullable(),
    request_id: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    start_time: DateStringSchema,
    end_time: DateStringSchema,
    location: z.string().max(200).nullable(),
    status: SessionStatusEnum,
    remind_at: DateStringSchema.nullable(),
    reminded: z.boolean(),
    created_by: UuidSchema,
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
});
export const SessionSeriesSchema = z.object({
    id: UuidSchema,
    requestId: UuidSchema,
    frequency: SeriesFrequencyEnum,
    interval: z.number().int().positive(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    startDate: z.string(),
    endDate: z.string(),
    startTime: z.string(),
    durationMinutes: z.number().int().positive(),
    location: z.string().max(200).nullable(),
    createdBy: UuidSchema,
    createdAt: DateStringSchema,
});
export const SessionSeriesDTOSchema = z.object({
    id: UuidSchema,
    request_id: UuidSchema,
    frequency: SeriesFrequencyEnum,
    interval: z.number().int().positive(),
    days_of_week: z.array(z.number().int().min(0).max(6)),
    start_date: z.string(),
    end_date: z.string(),
    start_time: z.string(),
    duration_minutes: z.number().int().positive(),
    location: z.string().max(200).nullable(),
    created_by: UuidSchema,
    created_at: DateStringSchema,
});
export const SessionAttendeeSchema = z.object({
    id: UuidSchema,
    sessionId: UuidSchema,
    userId: UuidSchema,
    status: AttendeeStatusEnum,
    updatedAt: DateStringSchema,
});
export const SessionAttendeeWithUserSchema = SessionAttendeeSchema.extend({
    fullName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
});
export const CreateSessionRequestSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    startTime: z.string().optional(),
    durationMinutes: z.number().int().positive().optional(),
    location: z.string().max(200).optional(),
    startDate: z.string().optional(),
    seriesEndDate: z.string().optional(),
    time: z.string().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    frequency: SeriesFrequencyEnum.optional(),
    reminderMinutes: z.number().int().positive().optional(),
});
export const UpdateAvailabilityRequestSchema = z.object({
    status: AttendeeStatusEnum,
});
export const CreateSessionResultSchema = z.union([
    z.object({
        type: z.literal("single"),
        session: StudySessionSchema,
    }),
    z.object({
        type: z.literal("recurring"),
        series: SessionSeriesSchema,
        sessions: z.array(StudySessionSchema),
        count: z.number().int(),
    }),
]);
//# sourceMappingURL=session.schema.js.map