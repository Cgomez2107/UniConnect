import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class CancelStudyRequest {
  constructor(private readonly repository: IStudyRequestRepository) {}

  async execute(id: string, actorUserId: string): Promise<StudyRequest> {
    const normalizedId = requireTrimmed(id, "studyRequestId");
    const normalizedUserId = requireTrimmed(actorUserId, "actorUserId");
    return this.repository.cancel(normalizedId, normalizedUserId);
  }
}
