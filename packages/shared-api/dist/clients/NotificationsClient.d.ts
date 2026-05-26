import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import type { Notification, NotificationPreference, UpdatePreferenceBody } from "@uniconnect/shared-types";
export declare class NotificationsClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    list(): Promise<Notification[]>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(): Promise<void>;
    getPreferences(): Promise<NotificationPreference[]>;
    updatePreference(body: UpdatePreferenceBody): Promise<void>;
}
//# sourceMappingURL=NotificationsClient.d.ts.map