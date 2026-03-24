/**
 * Entidad: Programa académico (carrera)
 * Ej: Ingeniería de Sistemas, Administración de Empresas
 */
export interface Program {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
  readonly facultyId: string;
  readonly facultyName?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}
