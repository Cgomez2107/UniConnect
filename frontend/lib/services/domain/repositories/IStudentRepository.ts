import type { StudentPublicProfile, StudentSearchResult, PerfilCompleto } from "@/types"

export interface IStudentRepository {
  searchBySubject(
    subjectId: string,
    currentUserId: string,
    page?: number,
    pageSize?: number
  ): Promise<StudentSearchResult[]>
  getPublicProfile(studentId: string, currentUserId: string): Promise<StudentPublicProfile | null>

  /** D02: Obtiene perfil decorado con estadísticas e insignias (?vista=completa) */
  getDecoratedProfile(studentId: string): Promise<PerfilCompleto | null>
}
