import type { Subject } from "../../domain/entities/Subject.js";
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository.js";

/**
 * Caso de uso: obtener materias de un programa
 * Para que el usuario añada sus materias en onboarding
 */
export class GetSubjectsByProgram {
  constructor(private readonly repository: IFacultyCatalogRepository) {}

  async execute(programId: string): Promise<Subject[]> {
    if (!programId.trim()) {
      throw new Error("Program ID is required");
    }

    return this.repository.getSubjectsByProgram(programId.trim());
  }
}
