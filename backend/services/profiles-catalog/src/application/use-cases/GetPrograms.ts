import type { Program } from "../../domain/entities/Program.js";
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository.js";

/**
 * Caso de uso: obtener lista de programas académicos
 * Para que el usuario seleccione su carrera en onboarding
 */
export class GetPrograms {
  constructor(private readonly repository: IFacultyCatalogRepository) {}

  async execute(facultyId?: string): Promise<Program[]> {
    if (facultyId && facultyId.trim()) {
      return this.repository.getProgramsByFaculty(facultyId.trim());
    }

    // Si no se especifica facultad, obtener todas las facultades y sus programas
    const faculties = await this.repository.getAllFaculties();
    const allPrograms: Program[] = [];

    for (const faculty of faculties) {
      const programs = await this.repository.getProgramsByFaculty(faculty.id);
      allPrograms.push(...programs);
    }

    return allPrograms;
  }
}
