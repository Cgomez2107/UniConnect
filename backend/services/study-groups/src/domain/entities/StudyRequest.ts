export type StudyRequestStatus = "abierta" | "cerrada" | "expirada";

export interface StudyRequest {
  readonly id: string;
  readonly authorId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly description: string;
  readonly maxMembers: number;
  readonly status: StudyRequestStatus;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly subjectName?: string;
  readonly facultyName?: string;
  readonly applicationsCount?: number;
  readonly author?: {
    readonly fullName: string;
    readonly avatarUrl: string | null;
    readonly bio?: string | null;
  };
}
