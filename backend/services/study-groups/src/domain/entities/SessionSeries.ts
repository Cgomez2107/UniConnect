export type SeriesFrequency = "weekly";

export interface SessionSeries {
  readonly id: string;
  readonly requestId: string;
  readonly frequency: SeriesFrequency;
  readonly interval: number;
  readonly daysOfWeek: number[];
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly durationMinutes: number;
  readonly location: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}
