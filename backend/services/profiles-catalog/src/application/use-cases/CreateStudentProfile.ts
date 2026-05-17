import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

export class CreateStudentProfile {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(data: { id: string; fullName: string }): Promise<Student> {
    return this.repository.create({
      id: data.id,
      fullName: data.fullName,
      role: "estudiante",
      isActive: true,
    });
  }
}
