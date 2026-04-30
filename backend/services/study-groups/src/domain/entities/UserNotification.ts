export interface UserNotification {
  readonly id: string;
  readonly userId: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly payload: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly readAt: string | null;
}
