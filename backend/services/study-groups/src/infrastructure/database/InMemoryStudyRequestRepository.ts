import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";

/**
 * Temporary repository for bootstrapping service contracts and integration.
 * Replace with a Postgres implementation once the DB adapter is ready.
 */
export class InMemoryStudyRequestRepository implements IStudyRequestRepository {
  private readonly requests: StudyRequest[] = [
    {
      id: "a1b2c3d4-0001-4000-9000-111111111111",
      authorId: "user-01",
      subjectId: "subject-math",
      title: "Calculo diferencial - repaso parcial",
      description: "Busco equipo para resolver ejercicios del capitulo 3.",
      maxMembers: 5,
      status: "abierta",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "a1b2c3d4-0001-4000-9000-222222222222",
      authorId: "user-02",
      subjectId: "subject-physics",
      title: "Fisica I - laboratorio",
      description: "Grupo para preparar informe semanal.",
      maxMembers: 4,
      status: "abierta",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  async listOpen(filters: { subjectId?: string; search?: string } = {}): Promise<StudyRequest[]> {
    const search = filters.search?.toLowerCase();

    return this.requests.filter((request) => {
      if (request.status !== "abierta" || !request.isActive) {
        return false;
      }

      if (filters.subjectId && request.subjectId !== filters.subjectId) {
        return false;
      }

      if (search) {
        const haystack = `${request.title} ${request.description}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }

  async getById(id: string): Promise<StudyRequest | null> {
    return this.requests.find((request) => request.id === id) ?? null;
  }

  async create(input: {
    authorId: string;
    subjectId: string;
    title: string;
    description: string;
    maxMembers: number;
  }): Promise<StudyRequest> {
    const now = new Date().toISOString();
    const created: StudyRequest = {
      id: crypto.randomUUID(),
      authorId: input.authorId,
      subjectId: input.subjectId,
      title: input.title,
      description: input.description,
      maxMembers: input.maxMembers,
      status: "abierta",
      isActive: true,
      createdAt: now,
      updatedAt: now,
      subjectName: input.subjectId,
      applicationsCount: 1,
    };

    this.requests.unshift(created);
    return created;
  }

  async countBySubject(subjectId: string): Promise<number> {
    return this.requests.filter(
      (r) => r.subjectId === subjectId && r.status === "abierta" && r.isActive,
    ).length;
  }

  async listByAuthorId(authorId: string): Promise<StudyRequest[]> {
    return this.requests.filter((r) => r.authorId === authorId && r.isActive);
  }

  async cancel(id: string): Promise<StudyRequest> {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new NotFoundError(`Solicitud de estudio '${id}' no encontrada.`);
    }
    const request = this.requests[idx];
    if (request.status !== "abierta") {
      throw new ValidationError("Solo se pueden cancelar solicitudes abiertas.");
    }
    this.requests[idx] = {
      ...request,
      status: "cerrada",
      updatedAt: new Date().toISOString(),
    };
    return this.requests[idx];
  }
}
