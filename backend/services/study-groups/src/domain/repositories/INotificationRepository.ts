import type { UserNotification } from "../entities/UserNotification.js";

export interface INotificationRepository {
  create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
    priority?: "normal" | "urgente" | "critica";
    action?: { label: string; endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" };
  }): Promise<string>;
  listByUser(input: {
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<UserNotification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}
