import type { SessionSeries } from "../entities/SessionSeries.js";

export interface CreateSessionSeriesInput {
  requestId: string;
  frequency: "weekly";
  interval: number;
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
  startTime: string;
  durationMinutes: number;
  location: string | null;
  createdBy: string;
}

export interface ISessionSeriesRepository {
  create(input: CreateSessionSeriesInput): Promise<SessionSeries>;
  getById(id: string): Promise<SessionSeries | null>;
  listByRequestId(requestId: string): Promise<SessionSeries[]>;
}
