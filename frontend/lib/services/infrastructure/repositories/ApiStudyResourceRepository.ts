import { fetchApi } from "@/lib/api/httpClient";
import type { StudyResource } from "@/types";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository";

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
  async getById(id: string): Promise<StudyResource | null> {
    try {
      const data = await fetchApi<ApiResource>(`/resources/${id}`);
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
    const data = await fetchApi<ApiResource[]>(`/resources?${params.toString()}`);
    return (data ?? []).map(mapResource);
  }

  async getByUser(userId: string): Promise<StudyResource[]> {
    const params = new URLSearchParams({ userId });
    const data = await fetchApi<ApiResource[]>(`/resources?${params.toString()}`);
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
    },
  ): Promise<StudyResource> {
    void userId;

    const data = await fetchApi<ApiResource>("/resources", {
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
    const data = await fetchApi<ApiResource>(`/resources/${resourceId}`, {
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
    await fetchApi(`/resources/${resourceId}`, {
      method: "DELETE",
    });
  }
}
