import { BaseClient } from "./BaseClient.js";
import { mapStudyGroupDtoToDomain, mapStudyGroupMemberDtoToDomain, mapStudyApplicationDtoToDomain, mapMessageDtoToDomain, mapNotificationDtoToDomain, } from "../mappers/index.js";
export class StudyGroupsClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async list(params) {
        const response = await this.transport.request({
            method: "GET",
            url: "/study-groups",
            params: {
                ...(params?.subjectIds !== undefined && params.subjectIds.length > 0 && { subjectIds: params.subjectIds.join(",") }),
                ...(params?.subjectId !== undefined && { subjectIds: params.subjectId }),
                ...(params?.page !== undefined && { page: params.page }),
                ...(params?.limit !== undefined && { limit: params.limit }),
            },
        });
        return this.ensureArray(response.data).map((dto) => mapStudyGroupDtoToDomain(dto));
    }
    async getById(id) {
        const response = await this.transport.request({
            method: "GET",
            url: `/study-groups/${id}`,
        });
        return mapStudyGroupDtoToDomain(response.data);
    }
    async create(payload) {
        const response = await this.transport.request({
            method: "POST",
            url: "/study-groups",
            body: {
                subjectId: payload.subjectId,
                name: payload.title,
                description: payload.description,
                maxMembers: payload.maxMembers,
            },
        });
        return mapStudyGroupDtoToDomain(response.data);
    }
    async listMyStudyRequests() {
        const response = await this.transport.request({
            method: "GET",
            url: "/study-groups/me",
        });
        return this.ensureArray(response.data).map((dto) => mapStudyGroupDtoToDomain(dto));
    }
    async listApplications(groupId, params) {
        const response = await this.transport.request({
            method: "GET",
            url: `/study-groups/${groupId}/applications`,
            params: params?.status ? { status: params.status } : undefined,
        });
        return this.ensureArray(response.data).map((dto) => mapStudyApplicationDtoToDomain(dto));
    }
    async listMyApplications() {
        const response = await this.transport.request({
            method: "GET",
            url: "/study-groups/applications",
        });
        return this.ensureArray(response.data).map((dto) => mapStudyApplicationDtoToDomain(dto));
    }
    async listMembers(groupId) {
        const response = await this.transport.request({
            method: "GET",
            url: `/study-groups/${groupId}/members`,
        });
        return this.ensureArray(response.data).map((dto) => mapStudyGroupMemberDtoToDomain(dto));
    }
    async apply(groupId, message) {
        const response = await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/apply`,
            body: { message },
        });
        return mapStudyApplicationDtoToDomain(response.data);
    }
    async reviewApplication(applicationId, status) {
        await this.transport.request({
            method: "PUT",
            url: `/study-groups/applications/${applicationId}/review`,
            body: { status },
        });
    }
    async leave(groupId) {
        await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/leave`,
        });
    }
    async cancel(groupId) {
        await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/cancel`,
        });
    }
    async cancelMyApplication(applicationId) {
        await this.transport.request({
            method: "POST",
            url: `/study-groups/applications/${applicationId}/cancel`,
        });
    }
    async requestTransfer(groupId, targetUserId) {
        const response = await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/transfer`,
            body: { targetUserId },
        });
        return response.data;
    }
    async acceptTransfer(transferId) {
        await this.transport.request({
            method: "POST",
            url: `/study-groups/transfers/${transferId}/accept`,
        });
    }
    async rejectTransfer(transferId) {
        await this.transport.request({
            method: "POST",
            url: `/study-groups/transfers/${transferId}/reject`,
        });
    }
    async getMessages(groupId, limit) {
        const params = limit ? `?limit=${limit}` : "";
        const response = await this.transport.request({
            method: "GET",
            url: `/study-groups/${groupId}/messages${params}`,
        });
        return this.ensureArray(response.data).map((dto) => mapMessageDtoToDomain(dto));
    }
    async sendMessage(groupId, payload) {
        const body = { content: payload.content };
        if (payload.replyToMessageId)
            body.replyToMessageId = payload.replyToMessageId;
        if (payload.mediaUrl)
            body.mediaUrl = payload.mediaUrl;
        if (payload.mediaType)
            body.mediaType = payload.mediaType;
        if (payload.mentions)
            body.mentions = payload.mentions;
        if (payload.poll)
            body.poll = payload.poll;
        const response = await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/messages`,
            body,
        });
        return mapMessageDtoToDomain(response.data);
    }
    async toggleReaction(groupId, messageId, emoji) {
        const response = await this.transport.request({
            method: "POST",
            url: `/study-groups/${groupId}/messages/${messageId}/reactions`,
            body: { emoji },
        });
        return response.data;
    }
    async listNotifications() {
        const response = await this.transport.request({
            method: "GET",
            url: "/notifications",
        });
        return this.ensureArray(response.data).map((dto) => mapNotificationDtoToDomain(dto));
    }
}
//# sourceMappingURL=StudyGroupsClient.js.map