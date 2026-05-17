import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

export interface UserProgram {
  readonly id: string;
  readonly name: string;
  readonly isPrimary: boolean;
  readonly facultyName: string | null;
}

export class GetMyPrograms {
  constructor(private readonly repository: IStudentRepository) {}

  async execute(userId: string): Promise<UserProgram[]> {
    if (!userId.trim()) {
      throw new Error("User ID is required");
    }

    return this.repository.getMyPrograms(userId);
  }
}
