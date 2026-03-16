import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";

export interface CreateStudyRequestInput {
  readonly actorUserId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly description: string;
  readonly maxMembers: number;
}

export class CreateStudyRequest {
  constructor(private readonly repository: IStudyRequestRepository) {}

  async execute(input: CreateStudyRequestInput): Promise<StudyRequest> {
    const title = input.title.trim();
    const description = input.description.trim();

    if (!input.subjectId.trim()) {
      throw new Error("Subject id is required");
    }

    if (title.length === 0) {
      throw new Error("Title is required");
    }

    if (description.length === 0) {
      throw new Error("Description is required");
    }

    if (!Number.isInteger(input.maxMembers) || input.maxMembers < 2) {
      throw new Error("Max members must be an integer greater than or equal to 2");
    }

    return this.repository.create({
      authorId: input.actorUserId,
      subjectId: input.subjectId.trim(),
      title,
      description,
      maxMembers: input.maxMembers,
    });
  }
}