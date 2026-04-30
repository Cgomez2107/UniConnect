import type { UserNotification } from "../entities/UserNotification.js";

export interface INotificationRepository {
  create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
  }): Promise<string>;
  listByUser(input: {
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<UserNotification[]>;
}
