export type SessionStatus = "scheduled" | "cancelled";

export interface StudySession {
  readonly id: string;
  readonly seriesId: string | null;
  readonly requestId: string;
  readonly title: string;
  readonly description?: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly location: string | null;
  readonly status: SessionStatus;
  readonly remindAt: string | null;
  readonly reminded: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
