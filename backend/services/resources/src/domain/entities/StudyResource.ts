export interface OgMetadata {
  readonly ogTitle?: string;
  readonly ogImage?: string;
  readonly ogDescription?: string;
}

export interface StudyResource {
  readonly id: string;
  readonly userId: string;
  readonly programId: string;
  readonly subjectId: string;
  readonly resourceType: "file" | "link";
  readonly title: string;
  readonly description: string | null;
  readonly url: string | null;
  readonly ogTitle: string | null;
  readonly ogDescription: string | null;
  readonly ogImage: string | null;
  readonly ogScrapedAt: string | null;
  readonly fileUrl: string | null;
  readonly fileName: string | null;
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
  readonly resourceType: "file" | "link";
  readonly title: string;
  readonly description?: string;
  readonly url?: string;
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly ogImage?: string;
  readonly ogScrapedAt?: string;
  readonly fileUrl?: string;
  readonly fileName?: string;
  readonly fileType?: string;
  readonly fileSizeKb?: number;
}
