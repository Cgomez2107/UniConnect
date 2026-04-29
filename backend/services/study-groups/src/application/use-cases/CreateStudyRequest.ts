import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import { ConflictError } from "../../../../../shared/libs/errors/ConflictError.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

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
    const subjectId = requireTrimmed(input.subjectId, "subjectId");
    const title = requireTrimmed(input.title, "title");
    const description = requireTrimmed(input.description, "description");

    if (!Number.isInteger(input.maxMembers) || input.maxMembers < 2) {
      throw new Error("maxMembers debe ser un entero mayor o igual a 2.");
    }

    const currentCount = await this.repository.countBySubject(subjectId);
    if (currentCount >= 3) {
      throw new ConflictError("Esta materia ya alcanzó el límite de 3 grupos activos.");
    }

    return this.repository.create({
      authorId: input.actorUserId,
      subjectId,
      title,
      description,
      maxMembers: input.maxMembers,
    });
  }
}