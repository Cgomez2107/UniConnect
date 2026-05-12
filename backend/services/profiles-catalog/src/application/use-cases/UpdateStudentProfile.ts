import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

export interface UpdateProfileData {
  fullName?: string;
  bio?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export class UpdateStudentProfile {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(userId: string, data: UpdateProfileData): Promise<Student | null> {
    return this.repository.update(userId, {
      fullName: data.fullName,
      bio: data.bio,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
    });
  }
}
