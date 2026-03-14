import type { StudentPublicProfile, StudentSearchResult } from "@/types"

export interface IStudentRepository {
  searchBySubject(
    subjectId: string,
    currentUserId: string,
    page?: number,
    pageSize?: number
  ): Promise<StudentSearchResult[]>
  getPublicProfile(studentId: string, currentUserId: string): Promise<StudentPublicProfile | null>
}
