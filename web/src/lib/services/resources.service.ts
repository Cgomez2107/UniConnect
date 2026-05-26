/**
 * @deprecated Use deps.apiClients.resources directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";
import type { StudyResourceUI } from "@/types/ui";

function mapResource(r: any): StudyResourceUI {
  return {
    id: r.id,
    userId: r.userId ?? "",
    programId: r.programId ?? "",
    subjectId: r.subjectId ?? "",
    title: r.title,
    description: r.description ?? null,
    fileUrl: r.fileUrl ?? r.file_url ?? "",
    fileName: r.fileName ?? r.file_name ?? "",
    fileType: r.fileType ?? r.file_type ?? null,
    fileSizeKb: r.fileSizeKb ?? r.file_size_kb ?? null,
    resourceType: r.resourceType ?? r.resource_type ?? r.fileType ?? null,
    ogTitle: r.ogTitle ?? r.og_title ?? null,
    ogImage: r.ogImage ?? r.og_image ?? null,
    ogDescription: r.ogDescription ?? r.og_description ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? r.created_at ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updated_at ?? r.updatedAt,
    profiles: r.profiles ?? undefined,
    subjects: r.subjects ?? undefined,
  };
}

const resourcesService = {
  async listResources(filters?: { subjectId?: string; programId?: string; page?: number; perPage?: number }) {
    const resources = await deps.apiClients.resources.list(filters);
    return resources.map(mapResource);
  },

  async getResourceById(id: string) {
    const resource = await deps.apiClients.resources.getById(id);
    return mapResource(resource);
  },

  async uploadResource(payload: {
    subjectId: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileType?: string;
    fileSizeKb?: number;
    programId?: string;
    resourceType?: string;
  }) {
    const resource = await deps.apiClients.resources.create(payload);
    return mapResource(resource);
  },

  async deleteResource(id: string) {
    await deps.apiClients.resources.delete(id);
  },
};

export default resourcesService;
