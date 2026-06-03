export interface Reaction {
  emoji: string;
  userId: string;
}

export interface PollOption {
  text: string;
  votes: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  isOpen: boolean;
  closesAt: string | null;
  createdAt: string;
}

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
  readonly reactions: Reaction[];
  readonly poll: PollData | null;
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
  readonly poll?: PollData;
}
