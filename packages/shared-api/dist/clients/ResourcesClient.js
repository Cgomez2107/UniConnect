import { BaseClient } from "./BaseClient.js";
import { mapStudyResourceDtoToDomain, } from "../mappers/index.js";
export class ResourcesClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async list(filters) {
        const response = await this.transport.request({
            method: "GET",
            url: "/resources",
            params: {
                ...(filters?.subjectId !== undefined && { subjectId: filters.subjectId }),
                ...(filters?.userId !== undefined && { userId: filters.userId }),
                ...(filters?.search !== undefined && { search: filters.search }),
                ...(filters?.type !== undefined && { type: filters.type }),
                ...(filters?.programId !== undefined && { program_id: filters.programId }),
                ...(filters?.page !== undefined && { page: filters.page }),
                ...(filters?.perPage !== undefined && { limit: filters.perPage }),
            },
        });
        return this.ensureArray(response.data).map((dto) => mapStudyResourceDtoToDomain(dto));
    }
    async getBySubject(subjectId) {
        return this.list({ subjectId });
    }
    async getMyResources(userId) {
        return this.list({ userId });
    }
    async getById(id) {
        const response = await this.transport.request({
            method: "GET",
            url: `/resources/${id}`,
        });
        return mapStudyResourceDtoToDomain(response.data);
    }
    async create(payload) {
        const response = await this.transport.request({
            method: "POST",
            url: "/resources",
            body: {
                subjectId: payload.subjectId,
                title: payload.title,
                description: payload.description,
                fileUrl: payload.fileUrl,
                fileName: payload.fileName,
                fileType: payload.fileType,
                fileSizeKb: payload.fileSizeKb,
                programId: payload.programId,
                resourceType: payload.resourceType,
                ogTitle: payload.ogTitle,
                ogImage: payload.ogImage,
                ogDescription: payload.ogDescription,
            },
        });
        return mapStudyResourceDtoToDomain(response.data);
    }
    async update(id, payload) {
        const response = await this.transport.request({
            method: "PUT",
            url: `/resources/${id}`,
            body: {
                ...(payload.title !== undefined && { title: payload.title }),
                ...(payload.description !== undefined && { description: payload.description }),
            },
        });
        return mapStudyResourceDtoToDomain(response.data);
    }
    async delete(id) {
        await this.transport.request({
            method: "DELETE",
            url: `/resources/${id}`,
        });
    }
}
//# sourceMappingURL=ResourcesClient.js.map