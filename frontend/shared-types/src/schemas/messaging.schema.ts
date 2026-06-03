import { z } from "zod";
import { UuidSchema, DateStringSchema, UrlSchema } from "./_common.schema";
import { UserSchema, UserDTOSchema } from "./auth.schema";

export const ConversationTypeEnum = z.enum(["direct", "group"]);
export const MessageTypeEnum = z.enum(["text", "file", "mention", "reaction", "poll"]);

export const PollOptionSchema = z.object({
  text: z.string().min(1).max(500),
  votes: z.array(z.string().uuid()),
});

export const PollOptionDTOSchema = z.object({
  text: z.string().min(1).max(500),
  votes: z.array(z.string().uuid()),
});

export const PollDataSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(PollOptionSchema).min(2).max(20),
  isOpen: z.boolean(),
  closesAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const PollDataDTOSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(PollOptionDTOSchema).min(2).max(20),
  is_open: z.boolean(),
  closes_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const PollVoteRequestSchema = z.object({
  optionIndex: z.number().int().min(0),
});

export const MessageDecorationSchema = z.object({
  type: z.enum(["mention", "file", "reaction", "poll"]),
  data: z.record(z.any()),
});

export const MessageDecorationDTOSchema = z.object({
  type: z.enum(["mention", "file", "reaction", "poll"]),
  data: z.record(z.any()),
});

export const MessageAttachmentSchema = z.object({
  id: UuidSchema,
  type: z.string(),
  url: UrlSchema,
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  mimeType: z.string(),
});

export const MessageAttachmentDTOSchema = z.object({
  id: UuidSchema,
  type: z.string(),
  url: UrlSchema,
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  mime_type: z.string(),
});

export const MessageReactionSchema = z.object({
  id: UuidSchema,
  emoji: z.string().min(1).max(10),
  userId: UuidSchema,
  user: UserSchema.optional(),
  createdAt: DateStringSchema,
});

export const MessageReactionDTOSchema = z.object({
  id: UuidSchema,
  emoji: z.string().min(1).max(10),
  user_id: UuidSchema,
  user: UserDTOSchema.optional(),
  created_at: DateStringSchema,
});

export const MessageSchema = z.object({
  id: UuidSchema,
  conversationId: UuidSchema,
  senderId: UuidSchema,
  sender: UserSchema.optional(),
  content: z.string(),
  type: MessageTypeEnum,
  decorations: z.array(MessageDecorationSchema).optional(),
  attachments: z.array(MessageAttachmentSchema).optional(),
  reactions: z.array(MessageReactionSchema).optional(),
  poll: PollDataSchema.nullable().optional(),
  isEdited: z.boolean(),
  editedAt: DateStringSchema.optional(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const MessageDTOSchema = z.object({
  id: UuidSchema,
  conversation_id: UuidSchema,
  sender_id: UuidSchema,
  sender: UserDTOSchema.optional(),
  content: z.string(),
  type: MessageTypeEnum,
  decorations: z.array(MessageDecorationDTOSchema).optional(),
  attachments: z.array(MessageAttachmentDTOSchema).optional(),
  reactions: z.array(MessageReactionDTOSchema).optional(),
  poll_data: PollDataDTOSchema.nullable().optional(),
  is_edited: z.boolean(),
  edited_at: DateStringSchema.optional(),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});

export const ConversationSchema = z.object({
  id: UuidSchema,
  type: ConversationTypeEnum,
  name: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: UrlSchema.optional(),
  participants: z.array(UserSchema),
  lastMessage: MessageSchema.optional(),
  lastMessageAt: DateStringSchema.optional(),
  messageCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const ConversationDTOSchema = z.object({
  id: UuidSchema,
  type: ConversationTypeEnum,
  name: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  avatar_url: UrlSchema.optional(),
  participants: z.array(UserDTOSchema),
  last_message: MessageDTOSchema.optional(),
  last_message_at: DateStringSchema.optional(),
  message_count: z.number().int().nonnegative(),
  unread_count: z.number().int().nonnegative(),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});
