import { randomUUID } from "node:crypto";

import type { CreateStudyResourceInput, StudyResource } from "../../domain/entities/StudyResource.js";
import type {
  IStudyResourceRepository,
  ListStudyResourcesFilters,
} from "../../domain/repositories/IStudyResourceRepository.js";

export class InMemoryStudyResourceRepository implements IStudyResourceRepository {
  private readonly resources = new Map<string, StudyResource>();

  async list(filters: ListStudyResourcesFilters): Promise<{ rows: StudyResource[]; total: number }> {
    const search = filters.search?.trim().toLowerCase();

    const filtered = [...this.resources.values()]
      .filter((resource) => {
        if (filters.subjectId && resource.subjectId !== filters.subjectId) {
          return false;
        }

        if (filters.userId && resource.userId !== filters.userId) {
          return false;
        }

        if (filters.resourceType && resource.resourceType !== filters.resourceType) {
          return false;
        }

        if (!search) {
          return true;
        }

        return (
          resource.title.toLowerCase().includes(search) ||
          (resource.description ?? "").toLowerCase().includes(search)
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const total = filtered.length;
    const start = filters.page * filters.pageSize;
    const end = start + filters.pageSize;

    return { rows: filtered.slice(start, end), total };
  }

  async getById(id: string): Promise<StudyResource | null> {
    return this.resources.get(id) ?? null;
  }

  async create(input: CreateStudyResourceInput): Promise<StudyResource> {
    const now = new Date().toISOString();
    const resource: StudyResource = {
      id: randomUUID(),
      userId: input.userId,
      programId: input.programId,
      subjectId: input.subjectId,
      resourceType: input.resourceType,
      title: input.title,
      description: input.description ?? null,
      url: input.url ?? null,
      ogTitle: input.ogTitle ?? null,
      ogDescription: input.ogDescription ?? null,
      ogImage: input.ogImage ?? null,
      ogScrapedAt: input.ogScrapedAt ? new Date(input.ogScrapedAt).toISOString() : null,
      fileUrl: input.fileUrl ?? null,
      fileName: input.fileName ?? null,
      fileType: input.fileType ?? null,
      fileSizeKb: input.fileSizeKb ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.resources.set(resource.id, resource);
    return resource;
  }

  async updateById(
    id: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null> {
    const existing = this.resources.get(id);
    if (!existing) {
      return null;
    }
    const updated: StudyResource = {
      ...existing,
      title: payload.title?.trim() ? payload.title.trim() : existing.title,
      description: payload.description === undefined ? existing.description : payload.description,
      updatedAt: new Date().toISOString(),
    };

    this.resources.set(id, updated);
    return updated;
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.resources.has(id)) {
      return false;
    }
    this.resources.delete(id);
    return true;
  }
}
