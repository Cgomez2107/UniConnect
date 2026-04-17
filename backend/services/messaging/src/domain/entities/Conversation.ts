export interface ConversationSummary {
  readonly id: string;
  readonly participantA: string;
  readonly participantB: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly otherUserId: string;
  readonly otherUserName: string;
  readonly otherUserAvatar: string | null;
  readonly lastMessage: string | null;
  readonly lastMessageAt: string | null;
  readonly unreadCount: number;
}

export interface CreateConversationInput {
  readonly participantA: string;
  readonly participantB: string;
  readonly currentUserId: string;
}
