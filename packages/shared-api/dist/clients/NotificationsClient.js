import { BaseClient } from "./BaseClient.js";
import { mapNotificationDtoToDomain } from "../mappers/index.js";
export class NotificationsClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async list() {
        const response = await this.transport.request({
            method: "GET",
            url: "/notifications",
        });
        return this.ensureArray(response.data).map((dto) => mapNotificationDtoToDomain(dto));
    }
    async markAsRead(notificationId) {
        await this.transport.request({
            method: "PUT",
            url: `/notifications/${notificationId}/read`,
        });
    }
    async markAllAsRead() {
        await this.transport.request({
            method: "PUT",
            url: "/notifications/read-all",
        });
    }
    async getPreferences() {
        const response = await this.transport.request({
            method: "GET",
            url: "/notifications/preferences",
        });
        return response.data?.preferences ?? [];
    }
    async updatePreference(body) {
        await this.transport.request({
            method: "PUT",
            url: "/notifications/preferences",
            body,
        });
    }
}
//# sourceMappingURL=NotificationsClient.js.map