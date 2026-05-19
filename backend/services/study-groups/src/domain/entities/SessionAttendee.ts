export type AttendeeStatus = "pending" | "confirmed" | "declined";

export interface SessionAttendee {
  readonly id: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly status: AttendeeStatus;
  readonly createdAt?: string;
  readonly updatedAt: string;
}

export interface SessionAttendeeWithUser extends SessionAttendee {
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
}
