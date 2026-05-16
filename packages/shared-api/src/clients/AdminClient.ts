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

export class AdminClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async getUsers(): Promise<AdminUser[]> {
    const response = await this.transport.request<AdminUser[]>({
      method: "GET",
      url: "/admin/users",
    });
    return response.data;
  }

  async getRequests(): Promise<AdminRequest[]> {
    const response = await this.transport.request<AdminRequest[]>({
      method: "GET",
      url: "/admin/requests",
    });
    return response.data;
  }

  async getResources(): Promise<AdminResource[]> {
    const response = await this.transport.request<AdminResource[]>({
      method: "GET",
      url: "/admin/resources",
    });
    return response.data;
  }

  async getEvents(): Promise<AdminEvent[]> {
    const response = await this.transport.request<AdminEvent[]>({
      method: "GET",
      url: "/admin/events",
    });
    return response.data;
  }

  async getMetrics(): Promise<AdminMetrics> {
    const response = await this.transport.request<AdminMetrics>({
      method: "GET",
      url: "/admin/metrics",
    });
    return response.data;
  }
}
