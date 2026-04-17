import type { StudentPublicProfile } from "@/types"
import type { IStudentRepository } from "../../repositories/IStudentRepository"

export class GetStudentPublicProfile {
  constructor(private repository: IStudentRepository) {}

  async execute(studentId: string, currentUserId: string): Promise<StudentPublicProfile | null> {
    if (!studentId || studentId.trim().length === 0) {
      throw new Error("Student ID is required")
    }

    if (!currentUserId || currentUserId.trim().length === 0) {
      throw new Error("User ID is required")
    }

    return this.repository.getPublicProfile(studentId, currentUserId)
  }
}
