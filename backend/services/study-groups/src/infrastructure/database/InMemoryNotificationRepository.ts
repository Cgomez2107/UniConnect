import type { UserNotification } from "../../domain/entities/UserNotification.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

export class InMemoryNotificationRepository implements INotificationRepository {
  private readonly notifications: UserNotification[] = [];

  async markAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.readAt = new Date().toISOString();
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    for (const notification of this.notifications) {
      if (notification.userId === userId && !notification.readAt) {
        notification.readAt = new Date().toISOString();
      }
    }
  }

  async create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
    priority?: "normal" | "urgente" | "critica";
    action?: { label: string; endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" };
  }): Promise<string> {
    const created: UserNotification = {
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      payload: input.payload,
      createdAt: new Date().toISOString(),
      readAt: null,
      priority: input.priority,
      action: input.action,
    };

    this.notifications.unshift(created);
    return created.id;
  }

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
