import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

/**
 * Caso de uso: buscar compañeros en una materia específica
 * Usado por el frontend para encontrar gente con la que formar grupos
 */
export class SearchStudentsBySubject {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(input: {
    subjectId: string;
    search?: string;
  }): Promise<Student[]> {
    if (!input.subjectId.trim()) {
      throw new Error("Subject ID is required");
    }

    return this.repository.searchBySubject(
      input.subjectId.trim(),
      input.search?.trim(),
    );
  }
}
