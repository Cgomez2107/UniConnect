import type { StudyResource } from "../../domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";

export class UpdateStudyResource {
  constructor(private readonly repository: IStudyResourceRepository) {}

  async execute(
    id: string,
    actorUserId: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null> {
    if (!id.trim()) {
      throw new Error("id es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticación requerido.");
    }

    const hasTitle = typeof payload.title === "string";
    const hasDescription = payload.description !== undefined;

    if (!hasTitle && !hasDescription) {
      throw new Error("Debes enviar al menos title o description.");
    }

    return this.repository.updateById(id, actorUserId, payload);
  }
}
