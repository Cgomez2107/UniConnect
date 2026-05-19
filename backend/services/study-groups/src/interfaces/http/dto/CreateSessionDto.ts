export interface CreateSessionDto {
  readonly title?: string;
  readonly description?: string;
  readonly startTime?: string;
  readonly durationMinutes?: number;
  readonly location?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly seriesEndDate?: string;
  readonly time?: string;
  readonly daysOfWeek?: number[];
  readonly frequency?: "weekly";
}
