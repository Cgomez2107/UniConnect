import type { UserNotification } from "../entities/UserNotification.js";

export interface INotificationRepository {
  listByUser(input: {
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<UserNotification[]>;
}
