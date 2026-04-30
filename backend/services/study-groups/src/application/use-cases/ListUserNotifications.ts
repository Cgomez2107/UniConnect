import type { UserNotification } from "../../domain/entities/UserNotification.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

export interface ListUserNotificationsInput {
  readonly actorUserId: string;
  readonly page: number;
  readonly pageSize: number;
}

export class ListUserNotifications {
  constructor(private readonly repository: INotificationRepository) {}

  async execute(input: ListUserNotificationsInput): Promise<UserNotification[]> {
    return this.repository.listByUser({
      actorUserId: input.actorUserId,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
