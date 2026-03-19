import { randomUUID } from "node:crypto";

import type { CreateStudyResourceInput, StudyResource } from "../../domain/entities/StudyResource.js";
import type {
  IStudyResourceRepository,
  ListStudyResourcesFilters,
} from "../../domain/repositories/IStudyResourceRepository.js";

export class InMemoryStudyResourceRepository implements IStudyResourceRepository {
  private readonly resources = new Map<string, StudyResource>();

  async list(filters: ListStudyResourcesFilters): Promise<StudyResource[]> {
    const search = filters.search?.trim().toLowerCase();

    const filtered = [...this.resources.values()]
      .filter((resource) => {
        if (filters.subjectId && resource.subjectId !== filters.subjectId) {
          return false;
        }

        if (filters.userId && resource.userId !== filters.userId) {
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

    const start = filters.page * filters.pageSize;
    const end = start + filters.pageSize;

    return filtered.slice(start, end);
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
      title: input.title,
      description: input.description ?? null,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
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
    actorUserId: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null> {
    const existing = this.resources.get(id);
    if (!existing) {
      return null;
    }

    if (existing.userId !== actorUserId) {
      throw new Error("Solo el autor puede editar este recurso.");
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

  async deleteById(id: string, actorUserId: string): Promise<boolean> {
    const existing = this.resources.get(id);
    if (!existing) {
      return false;
    }

    if (existing.userId !== actorUserId) {
      throw new Error("Solo el autor puede eliminar este recurso.");
    }

    this.resources.delete(id);
    return true;
  }
}
