/**
 * Entidad: Facultad
 * Unidad académica (Ingeniería, Ciencias, etc.)
 */
export interface Faculty {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}
