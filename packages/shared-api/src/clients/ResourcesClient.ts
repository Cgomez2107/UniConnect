import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import {
  mapStudyResourceDtoToDomain,
  mapStudyResourceDomainToDto,
} from "../mappers/index.js";
import type {
  StudyResourceDTO,
  StudyResource,
} from "@uniconnect/shared-types";

export interface CreateStudyResourcePayload {
  subjectId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
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

export class ResourcesClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async list(filters?: ListResourcesFilters): Promise<StudyResource[]> {
    const response = await this.transport.request<StudyResourceDTO[]>({
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

  async getBySubject(subjectId: string): Promise<StudyResource[]> {
    return this.list({ subjectId });
  }

  async getMyResources(userId: string): Promise<StudyResource[]> {
    return this.list({ userId });
  }

  async getById(id: string): Promise<StudyResource> {
    const response = await this.transport.request<StudyResourceDTO>({
      method: "GET",
      url: `/resources/${id}`,
    });
    return mapStudyResourceDtoToDomain(response.data);
  }

  async create(payload: CreateStudyResourcePayload): Promise<StudyResource> {
    const response = await this.transport.request<StudyResourceDTO>({
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

  async update(id: string, payload: UpdateStudyResourcePayload): Promise<StudyResource> {
    const response = await this.transport.request<StudyResourceDTO>({
      method: "PUT",
      url: `/resources/${id}`,
      body: {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
      },
    });
    return mapStudyResourceDtoToDomain(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.transport.request({
      method: "DELETE",
      url: `/resources/${id}`,
    });
  }
}
