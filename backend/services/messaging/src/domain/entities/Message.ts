export interface Message {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
  readonly mediaUrl: string | null;
  readonly mediaType: string | null;
  readonly mediaFilename: string | null;
  readonly replyToMessageId: string | null;
  readonly replyPreview: string | null;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly sender: {
    readonly fullName: string;
    readonly avatarUrl: string | null;
  } | null;
}

export interface CreateMessageInput {
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
  readonly mediaUrl?: string;
  readonly mediaType?: string;
  readonly mediaFilename?: string;
  readonly replyToMessageId?: string;
  readonly replyPreview?: string;
}
