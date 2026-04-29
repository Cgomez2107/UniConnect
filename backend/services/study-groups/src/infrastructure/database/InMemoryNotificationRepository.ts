import type { UserNotification } from "../../domain/entities/UserNotification.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

export class InMemoryNotificationRepository implements INotificationRepository {
  private readonly notifications: UserNotification[] = [];

  async listByUser(input: {
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<UserNotification[]> {
    const offset = input.page * input.pageSize;
    return this.notifications
      .filter((notification) => notification.userId === input.actorUserId)
      .slice(offset, offset + input.pageSize);
  }
}
