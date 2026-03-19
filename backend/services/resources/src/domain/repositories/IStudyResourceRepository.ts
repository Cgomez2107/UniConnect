import type { CreateStudyResourceInput, StudyResource } from "../entities/StudyResource.js";

export interface ListStudyResourcesFilters {
  readonly subjectId?: string;
  readonly userId?: string;
  readonly search?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface IStudyResourceRepository {
  list(filters: ListStudyResourcesFilters): Promise<StudyResource[]>;
  getById(id: string): Promise<StudyResource | null>;
  create(input: CreateStudyResourceInput): Promise<StudyResource>;
  updateById(
    id: string,
    actorUserId: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null>;
  deleteById(id: string, actorUserId: string): Promise<boolean>;
}
