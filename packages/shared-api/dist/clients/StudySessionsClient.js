import { BaseClient } from "./BaseClient.js";
export class StudySessionsClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async createSeries(groupId, payload) {
        const response = await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/sessions/series`,
            body: {
                title: payload.title,
                description: payload.description ?? "",
                startTime: payload.startTime,
                endTime: payload.endTime,
                ...(payload.rrule !== undefined && { rrule: payload.rrule }),
                ...(payload.weekCount !== undefined && { weekCount: payload.weekCount }),
            },
        });
        return this.ensureArray(response.data);
    }
    async listByGroup(groupId, from, to) {
        const response = await this.transport.request({
            method: "GET",
            url: `/study-groups/${groupId}/sessions`,
            params: {
                ...(from !== undefined && { from }),
                ...(to !== undefined && { to }),
            },
        });
        return this.ensureArray(response.data);
    }
    async cancel(sessionId) {
        const response = await this.transport.request({
            method: "DELETE",
            url: `/study-groups/sessions/${sessionId}`,
        });
        return response.data;
    }
}
//# sourceMappingURL=StudySessionsClient.js.map