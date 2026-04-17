import type { Faculty } from "../entities/Faculty.js";
import type { Program } from "../entities/Program.js";
import type { Subject } from "../entities/Subject.js";

/**
 * Contrato: acceso al catálogo de la universidad
 * Facultades, programas, materias
 */
export interface IFacultyCatalogRepository {
  /**
   * Obtener todas las facultades activas
   */
  getAllFaculties(): Promise<Faculty[]>;

  /**
   * Obtener programas de una facultad específica
   */
  getProgramsByFaculty(facultyId: string): Promise<Program[]>;

  /**
   * Obtener materias de un programa específico
   */
  getSubjectsByProgram(programId: string): Promise<Subject[]>;

  /**
   * Obtener todas las materias activas
   */
  getAllSubjects(): Promise<Subject[]>;

  /**
   * Obtener materia por ID
   */
  getSubjectById(subjectId: string): Promise<Subject | null>;
}
