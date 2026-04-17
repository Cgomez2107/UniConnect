import type { Student } from "../entities/Student.js";

/**
 * Contrato: búsqueda y obtención de perfiles de estudiantes
 * Implementación: Postgres via pg pool
 */
export interface IStudentRepository {
  /**
   * Buscar estudiantes inscritos en una materia específica
   * Soporta búsqueda por nombre
   */
  searchBySubject(subjectId: string, searchTerm?: string): Promise<Student[]>;

  /**
   * Obtener perfil público de un estudiante por ID
   */
  getById(id: string): Promise<Student | null>;

  /**
   * Obtener perfil de un estudiante por user_id (equivalente a ID de perfil)
   */
  getByUserId(userId: string): Promise<Student | null>;
}
