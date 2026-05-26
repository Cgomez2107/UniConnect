import { z } from "zod";
export declare const CreateStudySessionSeriesSchema: z.ZodObject<{
    groupId: z.ZodString;
    title: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    rrule: z.ZodOptional<z.ZodString>;
    weekCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    groupId: string;
    title: string;
    startTime: string;
    endTime: string;
    weekCount: number;
    rrule?: string | undefined;
}, {
    groupId: string;
    title: string;
    startTime: string;
    endTime: string;
    description?: string | undefined;
    rrule?: string | undefined;
    weekCount?: number | undefined;
}>;
export declare const CancelStudySessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const StudySessionSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    title: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    rrule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parentSeriesId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createdBy: z.ZodString;
    cancelledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reminderSentAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    id: string;
    description: string;
    createdBy: string;
    groupId: string;
    title: string;
    startTime: string;
    endTime: string;
    rrule?: string | null | undefined;
    parentSeriesId?: string | null | undefined;
    cancelledAt?: string | null | undefined;
    reminderSentAt?: string | null | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    id: string;
    createdBy: string;
    groupId: string;
    title: string;
    startTime: string;
    endTime: string;
    description?: string | undefined;
    rrule?: string | null | undefined;
    parentSeriesId?: string | null | undefined;
    cancelledAt?: string | null | undefined;
    reminderSentAt?: string | null | undefined;
}>;
export declare const StudySessionDTOSchema: z.ZodObject<{
    id: z.ZodString;
    group_id: z.ZodString;
    title: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    start_time: z.ZodString;
    end_time: z.ZodString;
    rrule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parent_series_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    created_by: z.ZodString;
    cancelled_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reminder_sent_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    description: string;
    created_by: string;
    group_id: string;
    title: string;
    start_time: string;
    end_time: string;
    rrule?: string | null | undefined;
    parent_series_id?: string | null | undefined;
    cancelled_at?: string | null | undefined;
    reminder_sent_at?: string | null | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    group_id: string;
    title: string;
    start_time: string;
    end_time: string;
    description?: string | undefined;
    rrule?: string | null | undefined;
    parent_series_id?: string | null | undefined;
    cancelled_at?: string | null | undefined;
    reminder_sent_at?: string | null | undefined;
}>;
export type CreateStudySessionSeriesInput = z.infer<typeof CreateStudySessionSeriesSchema>;
//# sourceMappingURL=study-session.schema.d.ts.map