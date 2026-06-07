import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

export class MarkNotificationAsRead {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string): Promise<void> {
    await this.notificationRepository.markAsRead(notificationId);
  }
}
