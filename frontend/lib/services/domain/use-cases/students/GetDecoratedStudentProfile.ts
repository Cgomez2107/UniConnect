import type { PerfilCompleto } from "@/types"
import type { IStudentRepository } from "../../repositories/IStudentRepository"

export class GetDecoratedStudentProfile {
  constructor(private repository: IStudentRepository) {}

  async execute(studentId: string): Promise<PerfilCompleto | null> {
    if (!studentId || studentId.trim().length === 0) {
      throw new Error("Student ID is required")
    }
    return this.repository.getDecoratedProfile(studentId)
  }
}
