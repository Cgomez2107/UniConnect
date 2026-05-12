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
  searchBySubject(subjectId?: string, searchTerm?: string, currentUserId?: string): Promise<Student[]>;

  /**
   * Obtener perfil público de un estudiante por ID
   */
  getById(id: string): Promise<Student | null>;

  /**
   * Obtener perfil de un estudiante por user_id (equivalente a ID de perfil)
   */
  getByUserId(userId: string): Promise<Student | null>;

  /**
   * Obtener materias inscritas de un usuario
   */
  getSubjectsByUserId(userId: string): Promise<{ subjectId: string; name: string }[]>;

  /**
   * Obtener programas de un usuario
   */
  getMyPrograms(userId: string): Promise<Array<{ id: string; name: string; isPrimary: boolean; facultyName: string | null }>>;

  /**
   * Crear perfil de estudiante
   */
  create(data: { id: string; fullName: string; role?: string; isActive?: boolean }): Promise<Student>;

  /**
   * Actualizar perfil de estudiante
   */
  update(id: string, data: { fullName?: string; bio?: string | null; phoneNumber?: string | null; avatarUrl?: string | null }): Promise<Student | null>;

  /**
   * Establecer programa principal de forma atómica
   */
  setPrimaryProgram(userId: string, programId: string): Promise<void>;

  /**
   * Agregar materia a un usuario
   */
  addSubject(userId: string, subjectId: string): Promise<void>;

  /**
   * Eliminar materia de un usuario
   */
  removeSubject(userId: string, subjectId: string): Promise<void>;
}
