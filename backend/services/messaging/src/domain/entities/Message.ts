export interface Message {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
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
}
