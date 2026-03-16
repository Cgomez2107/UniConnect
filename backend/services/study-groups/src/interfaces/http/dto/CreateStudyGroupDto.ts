export interface CreateStudyGroupDto {
  readonly subjectId?: string;
  readonly title?: string;
  readonly description?: string;
  readonly maxMembers?: number;
}