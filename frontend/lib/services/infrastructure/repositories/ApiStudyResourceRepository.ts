import { fetchApi } from "@/lib/api/httpClient";
import type { StudyResource } from "@/types";
import type { IStudyResourceRepository, ListResourcesFilters } from "../../domain/repositories/IStudyResourceRepository";

interface ApiResource {
  id: string;
  userId?: string;
  user_id?: string;
  programId?: string;
  program_id?: string;
  subjectId?: string;
  subject_id?: string;
  title: string;
  description?: string | null;
  fileUrl?: string;
  file_url?: string;
  fileName?: string;
  file_name?: string;
  fileType?: string | null;
  file_type?: string | null;
  fileSizeKb?: number | null;
  file_size_kb?: number | null;
  resourceType?: string | null;
  resource_type?: string | null;
  ogTitle?: string | null;
  og_title?: string | null;
  ogImage?: string | null;
  og_image?: string | null;
  ogDescription?: string | null;
  og_description?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  profiles?: {
    fullName?: string;
    full_name?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
  };
  subjects?: {
    name: string;
  };
}

function mapResource(raw: ApiResource): StudyResource {
  return {
    id: raw.id,
    user_id: raw.userId ?? raw.user_id ?? "",
    program_id: raw.programId ?? raw.program_id ?? "",
    subject_id: raw.subjectId ?? raw.subject_id ?? "",
    title: raw.title,
    description: raw.description ?? null,
    file_url: raw.fileUrl ?? raw.file_url ?? "",
    file_name: raw.fileName ?? raw.file_name ?? "",
    file_type: raw.fileType ?? raw.file_type ?? null,
    file_size_kb: raw.fileSizeKb ?? raw.file_size_kb ?? null,
    resource_type: raw.resourceType ?? raw.resource_type ?? null,
    og_title: raw.ogTitle ?? raw.og_title ?? null,
    og_image: raw.ogImage ?? raw.og_image ?? null,
    og_description: raw.ogDescription ?? raw.og_description ?? null,
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
    profiles: raw.profiles
      ? {
          full_name: raw.profiles.fullName ?? raw.profiles.full_name ?? "",
          avatar_url: raw.profiles.avatarUrl ?? raw.profiles.avatar_url ?? null,
        }
      : undefined,
    subjects: raw.subjects,
  };
}

export class ApiStudyResourceRepository implements IStudyResourceRepository {
  async getAll(): Promise<StudyResource[]> {
    const data = await fetchApi<ApiResource[]>("/api/v1/resources");
    return (data ?? []).map(mapResource);
  }

  async getById(id: string): Promise<StudyResource | null> {
    try {
      const data = await fetchApi<ApiResource>(`/api/v1/resources/${id}`);
      return data ? mapResource(data) : null;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
        return null;
      }
      throw error;
    }
  }

  async getBySubject(subjectId: string): Promise<StudyResource[]> {
    const params = new URLSearchParams({ subjectId });
    const data = await fetchApi<ApiResource[]>(`/api/v1/resources?${params.toString()}`);
    return (data ?? []).map(mapResource);
  }

  async getByUser(userId: string): Promise<StudyResource[]> {
    const params = new URLSearchParams({ userId });
    const data = await fetchApi<ApiResource[]>(`/api/v1/resources?${params.toString()}`);
    return (data ?? []).map(mapResource);
  }

  async list(filters?: ListResourcesFilters): Promise<StudyResource[]> {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.set("subjectId", filters.subjectId);
    if (filters?.userId) params.set("userId", filters.userId);
    if (filters?.type) params.set("type", filters.type);
    const qs = params.toString();
    const data = await fetchApi<ApiResource[]>(`/api/v1/resources${qs ? `?${qs}` : ""}`);
    return (data ?? []).map(mapResource);
  }

  async create(
    userId: string,
    programId: string,
    payload: {
      subject_id: string;
      title: string;
      description?: string;
      file_url: string;
      file_name: string;
      file_type?: string;
      file_size_kb?: number;
      resource_type?: string;
      og_title?: string | null;
      og_description?: string | null;
      og_image?: string | null;
    },
  ): Promise<StudyResource> {
    void userId;

    const data = await fetchApi<ApiResource>("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify({
        programId,
        subjectId: payload.subject_id,
        title: payload.title,
        description: payload.description,
        fileUrl: payload.file_url,
        fileName: payload.file_name,
        fileType: payload.file_type,
        fileSizeKb: payload.file_size_kb,
        resourceType: payload.resource_type,
        ogTitle: payload.og_title,
        ogDescription: payload.og_description,
        ogImage: payload.og_image,
      }),
    });

    return mapResource(data);
  }

  async update(
    resourceId: string,
    userId: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource> {
    void userId;
    const data = await fetchApi<ApiResource>(`/api/v1/resources/${resourceId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
      }),
    });

    return mapResource(data);
  }

  async delete(resourceId: string, userId: string): Promise<void> {
    void userId;
    await fetchApi(`/api/v1/resources/${resourceId}`, {
      method: "DELETE",
    });
  }
}
