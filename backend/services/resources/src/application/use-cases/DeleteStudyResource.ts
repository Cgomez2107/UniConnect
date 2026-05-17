import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";
import type { IPermissionValidator } from "../../domain/services/IPermissionValidator.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";

interface StorageCleaner {
  deletePublicResource(fileUrl: string): Promise<void>;
}

export class DeleteStudyResource {
  constructor(
    private readonly repository: IStudyResourceRepository,
    private readonly permissionValidator: IPermissionValidator,
    private readonly storageCleaner?: StorageCleaner,
  ) {}

  async execute(id: string, actorUserId: string): Promise<boolean> {
    if (!id.trim()) {
      throw new ValidationError("id es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new ValidationError("Token de autenticación requerido.");
    }

    const existing = await this.repository.getById(id);
    if (!existing) {
      return false;
    }

    const allowed = await this.permissionValidator.canEditResource(id, actorUserId);
    if (!allowed) {
      throw new AuthorizationError("No tienes permisos para eliminar este recurso.");
    }

    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      return false;
    }

    if (existing.fileUrl && this.storageCleaner) {
      try {
        await this.storageCleaner.deletePublicResource(existing.fileUrl);
      } catch (error) {
        console.warn(
          JSON.stringify({
            service: "resources",
            level: "warn",
            message: "Storage cleanup failed after deleting resource",
            details: error instanceof Error ? error.message : "Unknown error",
            resourceId: id,
          }),
        );
      }
    }

    return true;
  }
}
