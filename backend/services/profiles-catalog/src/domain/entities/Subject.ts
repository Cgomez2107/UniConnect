/**
 * Entidad: Materia/Asignatura
 * Cursos que dicta la universidad
 */
export interface Subject {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
  readonly isActive: boolean;
  readonly credits: number | null;
  readonly semester: number | null;
  readonly createdAt: string;
}
