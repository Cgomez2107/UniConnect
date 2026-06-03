import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import type { StudyResource } from "@uniconnect/shared-types";
export interface CreateStudyResourcePayload {
    subjectId: string;
    title: string;
    description?: string;
    url?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSizeKb?: number;
    programId?: string;
    resourceType?: string;
    ogTitle?: string;
    ogImage?: string;
    ogDescription?: string;
}
export interface UpdateStudyResourcePayload {
    title?: string;
    description?: string;
}
export interface ListResourcesFilters {
    subjectId?: string;
    programId?: string;
    userId?: string;
    search?: string;
    type?: string;
    page?: number;
    perPage?: number;
}
export declare class ResourcesClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    list(filters?: ListResourcesFilters): Promise<StudyResource[]>;
    getBySubject(subjectId: string): Promise<StudyResource[]>;
    getMyResources(userId: string): Promise<StudyResource[]>;
    getById(id: string): Promise<StudyResource>;
    create(payload: CreateStudyResourcePayload): Promise<StudyResource>;
    update(id: string, payload: UpdateStudyResourcePayload): Promise<StudyResource>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=ResourcesClient.d.ts.map