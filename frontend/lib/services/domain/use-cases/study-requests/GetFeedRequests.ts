import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"
import type { StudyRequest } from "@/types" // Use existing types from types/index.ts

export class GetFeedRequests {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(filters?: { subject_id?: string; search?: string }, page = 0, pageSize = 10): Promise<StudyRequest[]> {
    return this.repository.getFeed(filters, page, pageSize)
  }
}
