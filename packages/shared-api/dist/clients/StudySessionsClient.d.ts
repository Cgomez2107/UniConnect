import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
export interface CreateSeriesPayload {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    rrule?: string;
    weekCount?: number;
}
export interface StudySessionDTO {
    id: string;
    group_id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    rrule?: string | null;
    parent_series_id?: string | null;
    created_by: string;
    cancelled_at?: string | null;
    reminder_sent_at?: string | null;
    created_at: string;
    updated_at: string;
}
export declare class StudySessionsClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    createSeries(groupId: string, payload: CreateSeriesPayload): Promise<StudySessionDTO[]>;
    listByGroup(groupId: string, from?: string, to?: string): Promise<StudySessionDTO[]>;
    cancel(sessionId: string): Promise<StudySessionDTO>;
}
//# sourceMappingURL=StudySessionsClient.d.ts.map