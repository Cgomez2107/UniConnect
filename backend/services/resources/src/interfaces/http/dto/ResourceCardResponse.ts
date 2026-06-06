interface ResourceAuthor {
  readonly fullName: string;
  readonly avatarUrl: string | null;
}

interface ResourceSubject {
  readonly name: string;
}

interface FileResourceFields {
  readonly type: 'file';
  readonly fileUrl: string | null;
  readonly fileName: string | null;
  readonly fileType: string | null;
  readonly fileSizeKb: number | null;
}

interface LinkResourceFields {
  readonly type: 'link';
  readonly url: string | null;
  readonly ogTitle: string | null;
  readonly ogDescription: string | null;
  readonly ogImage: string | null;
}

interface BaseResourceCardFields {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly profiles: ResourceAuthor | undefined;
  readonly subjects: ResourceSubject | undefined;
  readonly activeDecorators: readonly string[];
}

export type ResourceCardResponse = BaseResourceCardFields & (FileResourceFields | LinkResourceFields);
