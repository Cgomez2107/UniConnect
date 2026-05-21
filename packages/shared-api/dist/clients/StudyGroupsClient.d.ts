import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import type { StudyGroup, StudyGroupMember, StudyApplication, Message, Notification } from "@uniconnect/shared-types";
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
    mentions?: {
        userId: string;
        name: string;
    }[];
}
export interface ListApplicationsParams {
    status?: "pendiente" | "aceptada" | "rechazada";
}
export interface ListStudyGroupsParams {
    subjectId?: string;
    subjectIds?: string[];
    page?: number;
    limit?: number;
}
export declare class StudyGroupsClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    list(params?: ListStudyGroupsParams): Promise<StudyGroup[]>;
    getById(id: string): Promise<StudyGroup>;
    create(payload: CreateStudyGroupPayload): Promise<StudyGroup>;
    listMyStudyRequests(): Promise<StudyGroup[]>;
    listApplications(groupId: string, params?: ListApplicationsParams): Promise<StudyApplication[]>;
    listMyApplications(): Promise<StudyApplication[]>;
    listMembers(groupId: string): Promise<StudyGroupMember[]>;
    apply(groupId: string, message: string): Promise<StudyApplication>;
    reviewApplication(applicationId: string, status: "aceptada" | "rechazada"): Promise<void>;
    leave(groupId: string): Promise<void>;
    cancel(groupId: string): Promise<void>;
    requestTransfer(groupId: string, targetUserId: string): Promise<{
        id: string;
    }>;
    acceptTransfer(transferId: string): Promise<void>;
    rejectTransfer(transferId: string): Promise<void>;
    getMessages(groupId: string, limit?: number): Promise<Message[]>;
    sendMessage(groupId: string, payload: SendGroupMessagePayload): Promise<Message>;
    toggleReaction(groupId: string, messageId: string, emoji: string): Promise<{
        reactions: any[];
    }>;
    listNotifications(): Promise<Notification[]>;
}
//# sourceMappingURL=StudyGroupsClient.d.ts.map