import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

export class MarkAllNotificationsAsRead {
  constructor(private readonly repository: INotificationRepository) {}

  async execute(actorUserId: string): Promise<void> {
    await this.repository.markAllAsRead(actorUserId);
  }
}
