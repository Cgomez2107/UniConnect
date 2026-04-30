export interface StudyGroupMessage {
  readonly id: string;
  readonly requestId: string;
  readonly senderId: string;
  readonly content: string;
  readonly createdAt: string;
  readonly senderFullName: string | null;
  readonly senderAvatarUrl: string | null;
  // Nuevos campos para Decorator Pattern
  readonly mediaUrl?: string | null;
  readonly mediaType?: string | null;
  readonly mediaFilename?: string | null;
  readonly mentions?: any[] | null;
  readonly reactions?: any[] | null;
}
