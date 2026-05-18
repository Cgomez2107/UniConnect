import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import {
  mapStudyGroupDtoToDomain,
  mapStudyGroupMemberDtoToDomain,
  mapStudyApplicationDtoToDomain,
  mapMessageDtoToDomain,
  mapNotificationDtoToDomain,
} from "../mappers/index.js";
import type {
  StudyGroupDTO,
  StudyGroupMemberDTO,
  StudyApplicationDTO,
  MessageDTO,
  NotificationDTO,
  StudyGroup,
  StudyGroupMember,
  StudyApplication,
  Message,
  Notification,
} from "@uniconnect/shared-types";

export interface CreateStudyGroupPayload {
  subjectId: string;
  title: string;
  description: string;
  maxMembers: number;
}

export interface SendGroupMessagePayload {
  content: string;
  replyToMessageId?: string;
  mediaUrl?: string;
  mediaType?: string;
  mentions?: { userId: string; name: string }[];
}

export interface ListApplicationsParams {
  status?: "pendiente" | "aceptada" | "rechazada";
}

export interface ListStudyGroupsParams {
  subjectId?: string;
}

export class StudyGroupsClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async list(params?: ListStudyGroupsParams): Promise<StudyGroup[]> {
    const response = await this.transport.request<StudyGroupDTO[]>({
      method: "GET",
      url: "/study-groups",
      params: params?.subjectId ? { subjectIds: params.subjectId } : undefined,
    });
    return this.ensureArray(response.data).map((dto) => mapStudyGroupDtoToDomain(dto));
  }

  async getById(id: string): Promise<StudyGroup> {
    const response = await this.transport.request<StudyGroupDTO>({
      method: "GET",
      url: `/study-groups/${id}`,
    });
    return mapStudyGroupDtoToDomain(response.data);
  }

  async create(payload: CreateStudyGroupPayload): Promise<StudyGroup> {
    const response = await this.transport.request<StudyGroupDTO>({
      method: "POST",
      url: "/study-groups",
      body: {
        subjectId: payload.subjectId,
        title: payload.title,
        description: payload.description,
        maxMembers: payload.maxMembers,
      },
    });
    return mapStudyGroupDtoToDomain(response.data);
  }

  async listMyStudyRequests(): Promise<StudyGroup[]> {
    const response = await this.transport.request<StudyGroupDTO[]>({
      method: "GET",
      url: "/study-groups/me",
    });
    return this.ensureArray(response.data).map((dto) => mapStudyGroupDtoToDomain(dto));
  }

  async listApplications(groupId: string, params?: ListApplicationsParams): Promise<StudyApplication[]> {
    const response = await this.transport.request<StudyApplicationDTO[]>({
      method: "GET",
      url: `/study-groups/${groupId}/applications`,
      params: params?.status ? { status: params.status } : undefined,
    });
    return this.ensureArray(response.data).map((dto) => mapStudyApplicationDtoToDomain(dto));
  }

  async listMyApplications(): Promise<StudyApplication[]> {
    const response = await this.transport.request<StudyApplicationDTO[]>({
      method: "GET",
      url: "/study-groups/applications",
    });
    return this.ensureArray(response.data).map((dto) => mapStudyApplicationDtoToDomain(dto));
  }

  async listMembers(groupId: string): Promise<StudyGroupMember[]> {
    const response = await this.transport.request<StudyGroupMemberDTO[]>({
      method: "GET",
      url: `/study-groups/${groupId}/members`,
    });
    return this.ensureArray(response.data).map((dto) => mapStudyGroupMemberDtoToDomain(dto));
  }

  async apply(groupId: string, message: string): Promise<StudyApplication> {
    const response = await this.transport.request<StudyApplicationDTO>({
      method: "POST",
      url: `/study-groups/${groupId}/apply`,
      body: { message },
    });
    return mapStudyApplicationDtoToDomain(response.data);
  }

  async reviewApplication(applicationId: string, status: "aceptada" | "rechazada"): Promise<void> {
    await this.transport.request({
      method: "PUT",
      url: `/study-groups/applications/${applicationId}/review`,
      body: { status },
    });
  }

  async leave(groupId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/study-groups/${groupId}/leave`,
    });
  }

  async cancel(groupId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/study-groups/${groupId}/cancel`,
    });
  }

  async requestTransfer(groupId: string, targetUserId: string): Promise<{ id: string }> {
    const response = await this.transport.request<{ id: string }>({
      method: "POST",
      url: `/study-groups/${groupId}/transfer`,
      body: { targetUserId },
    });
    return response.data;
  }

  async acceptTransfer(transferId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/study-groups/transfers/${transferId}/accept`,
    });
  }

  async rejectTransfer(transferId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/study-groups/transfers/${transferId}/reject`,
    });
  }

  async getMessages(groupId: string): Promise<Message[]> {
    const response = await this.transport.request<MessageDTO[]>({
      method: "GET",
      url: `/study-groups/${groupId}/messages`,
    });
    return this.ensureArray(response.data).map((dto) => mapMessageDtoToDomain(dto));
  }

  async sendMessage(groupId: string, payload: SendGroupMessagePayload): Promise<Message> {
    const body: Record<string, any> = { content: payload.content };
    if (payload.replyToMessageId) body.replyToMessageId = payload.replyToMessageId;
    if (payload.mediaUrl) body.mediaUrl = payload.mediaUrl;
    if (payload.mediaType) body.mediaType = payload.mediaType;
    if (payload.mentions) body.mentions = payload.mentions;

    const response = await this.transport.request<MessageDTO>({
      method: "POST",
      url: `/study-groups/${groupId}/messages`,
      body,
    });
    return mapMessageDtoToDomain(response.data);
  }

  async toggleReaction(groupId: string, messageId: string, emoji: string): Promise<{ reactions: any[] }> {
    const response = await this.transport.request<{ reactions: any[] }>({
      method: "POST",
      url: `/study-groups/${groupId}/messages/${messageId}/reactions`,
      body: { emoji },
    });
    return response.data;
  }

  async listNotifications(): Promise<Notification[]> {
    const response = await this.transport.request<NotificationDTO[]>({
      method: "GET",
      url: "/notifications",
    });
    return this.ensureArray(response.data).map((dto) => mapNotificationDtoToDomain(dto));
  }
}
