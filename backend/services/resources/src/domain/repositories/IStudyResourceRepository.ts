import type { CreateStudyResourceInput, StudyResource } from "../entities/StudyResource.js";

export interface ListStudyResourcesFilters {
  readonly subjectId?: string;
  readonly userId?: string;
  readonly search?: string;
  readonly resourceType?: 'file' | 'link';
  readonly page: number;
  readonly pageSize: number;
}

export interface ListStudyResourcesResult {
  readonly rows: StudyResource[];
  readonly total: number;
}

export interface IStudyResourceRepository {
  list(filters: ListStudyResourcesFilters): Promise<ListStudyResourcesResult>;
  getById(id: string): Promise<StudyResource | null>;
  create(input: CreateStudyResourceInput): Promise<StudyResource>;
  updateById(
    id: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null>;
  deleteById(id: string): Promise<boolean>;
}
