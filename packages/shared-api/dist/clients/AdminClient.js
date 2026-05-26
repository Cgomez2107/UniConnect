import { BaseClient } from "./BaseClient.js";
export class AdminClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async getUsers() {
        const response = await this.transport.request({
            method: "GET",
            url: "/admin/users",
        });
        return response.data;
    }
    async getRequests() {
        const response = await this.transport.request({
            method: "GET",
            url: "/admin/requests",
        });
        return response.data;
    }
    async getResources() {
        const response = await this.transport.request({
            method: "GET",
            url: "/admin/resources",
        });
        return response.data;
    }
    async getEvents() {
        const response = await this.transport.request({
            method: "GET",
            url: "/admin/events",
        });
        return response.data;
    }
    async getMetrics() {
        const response = await this.transport.request({
            method: "GET",
            url: "/admin/metrics",
        });
        return response.data;
    }
}
//# sourceMappingURL=AdminClient.js.map