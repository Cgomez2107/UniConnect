export interface CreateStudyGroupMessageDto {
  readonly content?: string;
  readonly mediaUrl?: string;
  readonly mediaType?: string;
  readonly mediaFilename?: string;
  readonly mentions?: any[];
  readonly poll?: {
    question: string;
    options: (string | { text: string; votes?: string[] })[];
    isOpen: boolean;
    closesAt: string | null;
    createdAt: string;
  };
}
