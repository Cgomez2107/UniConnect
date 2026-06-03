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

export class StudySessionsClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async createSeries(groupId: string, payload: CreateSeriesPayload): Promise<StudySessionDTO[]> {
    const response = await this.transport.request<StudySessionDTO[]>({
      method: "POST",
      url: `/study-groups/${groupId}/sessions/series`,
      body: {
        title: payload.title,
        description: payload.description ?? "",
        startTime: payload.startTime,
        endTime: payload.endTime,
        ...(payload.rrule !== undefined && { rrule: payload.rrule }),
        ...(payload.weekCount !== undefined && { weekCount: payload.weekCount }),
      },
    });
    return this.ensureArray(response.data);
  }

  async listByGroup(groupId: string, from?: string, to?: string): Promise<StudySessionDTO[]> {
    const response = await this.transport.request<StudySessionDTO[]>({
      method: "GET",
      url: `/study-groups/${groupId}/sessions`,
      params: {
        ...(from !== undefined && { from }),
        ...(to !== undefined && { to }),
      },
    });
    return this.ensureArray(response.data);
  }

  async cancel(sessionId: string): Promise<StudySessionDTO> {
    const response = await this.transport.request<StudySessionDTO>({
      method: "DELETE",
      url: `/study-groups/sessions/${sessionId}`,
    });
    return response.data;
  }
}
