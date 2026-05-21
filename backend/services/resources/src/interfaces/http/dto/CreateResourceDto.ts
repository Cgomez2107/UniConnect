export interface CreateResourceDto {
  readonly programId?: string;
  readonly subjectId?: string;
  readonly title?: string;
  readonly description?: string;
  readonly fileUrl?: string;
  readonly fileName?: string;
  readonly fileType?: string;
  readonly fileSizeKb?: number;
  readonly ogTitle?: string | null;
  readonly ogDescription?: string | null;
  readonly ogImage?: string | null;
}
