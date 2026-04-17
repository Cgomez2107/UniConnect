/**
 * Entidad: Estudiante (perfil público para búsqueda)
 * Contiene info que otros estudiantes ven al buscar compañeros
 */
export interface Student {
  readonly id: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;
  readonly bio: string | null;
  readonly semester: number | null;
  readonly programId: string;
  readonly programName?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
