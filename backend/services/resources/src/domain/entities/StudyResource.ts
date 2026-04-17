export interface StudyResource {
  readonly id: string;
  readonly userId: string;
  readonly programId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly description: string | null;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileType: string | null;
  readonly fileSizeKb: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly profiles?: {
    readonly fullName: string;
    readonly avatarUrl: string | null;
  };
  readonly subjects?: {
    readonly name: string;
  };
}

export interface CreateStudyResourceInput {
  readonly userId: string;
  readonly programId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly description?: string;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileType?: string;
  readonly fileSizeKb?: number;
}
