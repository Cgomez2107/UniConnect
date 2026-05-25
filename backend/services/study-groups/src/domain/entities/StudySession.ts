export interface StudySession {
  readonly id: string;
  readonly groupId: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly rrule?: string | null;
  readonly parentSeriesId?: string | null;
  readonly createdBy: string;
  readonly cancelledAt?: string | null;
  readonly reminderSentAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateSessionInput {
  readonly groupId: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly rrule?: string | null;
  readonly parentSeriesId?: string | null;
  readonly createdBy: string;
}
