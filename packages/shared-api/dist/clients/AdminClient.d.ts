import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
export interface AdminUser {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    semester: number | null;
    avatarUrl: string | null;
    createdAt: string;
}
export interface AdminRequest {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    authorName: string;
    subjectName: string;
    applicationsCount: number;
}
export interface AdminResource {
    id: string;
    title: string;
    fileType: string | null;
    fileSizeKb: number | null;
    createdAt: string;
    authorName: string;
    subjectName: string;
}
export interface AdminEvent {
    id: string;
    title: string;
    eventDate: string;
    location: string | null;
    category: string;
    createdAt: string;
    creatorName: string;
}
export interface AdminMetrics {
    totalUsers: number;
    activeStudents: number;
    openRequests: number;
    totalResources: number;
    totalMessages: number;
}
export declare class AdminClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    getUsers(): Promise<AdminUser[]>;
    getRequests(): Promise<AdminRequest[]>;
    getResources(): Promise<AdminResource[]>;
    getEvents(): Promise<AdminEvent[]>;
    getMetrics(): Promise<AdminMetrics>;
}
//# sourceMappingURL=AdminClient.d.ts.map