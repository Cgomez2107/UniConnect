import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import { mapNotificationDtoToDomain } from "../mappers/index.js";
import type {
  NotificationDTO,
  Notification,
  NotificationPreference,
  UpdatePreferenceBody,
} from "@uniconnect/shared-types";

export class NotificationsClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async list(): Promise<Notification[]> {
    const response = await this.transport.request<NotificationDTO[]>({
      method: "GET",
      url: "/notifications",
    });
    return this.ensureArray(response.data).map((dto) => mapNotificationDtoToDomain(dto));
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.transport.request({
      method: "PUT",
      url: `/notifications/${notificationId}/read`,
    });
  }

  async markAllAsRead(): Promise<void> {
    await this.transport.request({
      method: "PUT",
      url: "/notifications/read-all",
    });
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await this.transport.request<{ preferences: NotificationPreference[] }>({
      method: "GET",
      url: "/notifications/preferences",
    });
    return response.data?.preferences ?? [];
  }

  async updatePreference(body: UpdatePreferenceBody): Promise<void> {
    await this.transport.request({
      method: "PUT",
      url: "/notifications/preferences",
      body,
    });
  }
}
