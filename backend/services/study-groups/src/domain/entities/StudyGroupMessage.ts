export interface StudyGroupMessage {
  readonly id: string;
  readonly requestId: string;
  readonly senderId: string;
  readonly content: string;
  readonly createdAt: string;
  readonly senderFullName: string | null;
  readonly senderAvatarUrl: string | null;
}
