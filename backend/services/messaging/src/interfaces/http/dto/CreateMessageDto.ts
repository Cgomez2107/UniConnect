export interface CreateMessageDto {
  readonly conversationId?: string;
  readonly content?: string;
  readonly mediaUrl?: string;
  readonly mediaType?: string;
  readonly mediaFilename?: string;
  readonly replyToMessageId?: string;
  readonly replyPreview?: string;
}
