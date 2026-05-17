import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

/**
 * Caso de uso: buscar compañeros en una materia específica
 * Usado por el frontend para encontrar gente con la que formar grupos
 */
export class SearchStudentsBySubject {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(input: {
    subjectId?: string;
    search?: string;
    currentUserId?: string;
  }): Promise<Student[]> {
    return this.repository.searchBySubject(
      input.subjectId?.trim() || undefined,
      input.search?.trim(),
      input.currentUserId?.trim(),
    );
  }
}
