import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

/**
 * Caso de uso: obtener perfil público de un estudiante
 * Devuelve la información que otros estudiantes ven
 */
export class GetStudentPublicProfile {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(studentId: string, currentUserId?: string): Promise<Student | null> {
    if (!studentId.trim()) {
      throw new Error("Student ID is required");
    }

    const profile = await this.repository.getById(studentId.trim());
    if (!profile) return null;

    if (!currentUserId || !currentUserId.trim()) {
      return { ...profile, sharedSubjects: [] };
    }

    const [targetSubjects, mySubjects] = await Promise.all([
      this.repository.getSubjectsByUserId(studentId.trim()),
      this.repository.getSubjectsByUserId(currentUserId.trim()),
    ]);

    const mySubjectIds = new Set(mySubjects.map((s) => s.subjectId));
    const sharedSubjects = targetSubjects
      .filter((s) => mySubjectIds.has(s.subjectId))
      .map((s) => ({ id: s.subjectId, name: s.name }));

    return { ...profile, sharedSubjects };
  }
}
