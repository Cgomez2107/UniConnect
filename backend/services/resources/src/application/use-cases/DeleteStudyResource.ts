import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";

interface StorageCleaner {
  deletePublicResource(fileUrl: string): Promise<void>;
}

export class DeleteStudyResource {
  constructor(
    private readonly repository: IStudyResourceRepository,
    private readonly storageCleaner?: StorageCleaner,
  ) {}

  async execute(id: string, actorUserId: string): Promise<boolean> {
    if (!id.trim()) {
      throw new Error("id es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticación requerido.");
    }

    const existing = await this.repository.getById(id);
    if (!existing) {
      return false;
    }

    const deleted = await this.repository.deleteById(id, actorUserId);
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
