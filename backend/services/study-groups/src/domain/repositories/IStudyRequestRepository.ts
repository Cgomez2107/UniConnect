import type { StudyRequest } from "../entities/StudyRequest.js";

export interface IStudyRequestRepository {
  listOpen(filters?: { subjectId?: string; search?: string }): Promise<StudyRequest[]>;
  getById(id: string): Promise<StudyRequest | null>;
  create(input: {
    authorId: string;
    subjectId: string;
    title: string;
    description: string;
    maxMembers: number;
  }): Promise<StudyRequest>;
}
