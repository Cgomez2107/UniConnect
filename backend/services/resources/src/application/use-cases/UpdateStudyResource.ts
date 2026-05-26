import type { StudyResource } from "../../domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";
import type { IPermissionValidator } from "../../domain/services/IPermissionValidator.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";

export class UpdateStudyResource {
  constructor(
    private readonly repository: IStudyResourceRepository,
    private readonly permissionValidator: IPermissionValidator,
  ) {}

  async execute(
    id: string,
    actorUserId: string,
    isAdmin = false,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource> {
    if (!id.trim()) {
      throw new ValidationError("id es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new ValidationError("Token de autenticación requerido.");
    }

    const hasTitle = typeof payload.title === "string";
    const hasDescription = payload.description !== undefined;

    if (!hasTitle && !hasDescription) {
      throw new ValidationError("Debes enviar al menos title o description.");
    }

    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new NotFoundError("Recurso no encontrado.");
    }

    const allowed = await this.permissionValidator.canEditResource(id, actorUserId);
    if (!allowed) {
      throw new AuthorizationError("No tienes permisos para editar este recurso.");
    }

    const updated = await this.repository.updateById(id, payload);
    if (!updated) {
      throw new NotFoundError("Recurso no encontrado.");
    }

    return updated;
  }
}
