import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

/**
 * Caso de uso: obtener perfil público de un estudiante
 * Devuelve la información que otros estudiantes ven
 */
export class GetStudentPublicProfile {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(studentId: string): Promise<Student | null> {
    if (!studentId.trim()) {
      throw new Error("Student ID is required");
    }

    return this.repository.getById(studentId.trim());
  }
}
