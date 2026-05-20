import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  MessageSchema,
  MessageDTOSchema,
  MessageAttachmentSchema,
  MessageAttachmentDTOSchema,
  MessageReactionSchema,
  MessageReactionDTOSchema,
  MessageDecorationSchema,
  ConversationSchema,
  ConversationDTOSchema,
} from "../messaging.schema.js";
import { snakeToCamel } from "../../lib/mappers.js";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "student@ucaldas.edu.co",
  firstName: "Ana",
  lastName: "Gomez",
  role: "estudiante" as const,
  profileImageUrl: "https://example.com/avatar.png",
  isVerified: true,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
};

const validUserDto = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "student@ucaldas.edu.co",
  first_name: "Ana",
  last_name: "Gomez",
  role: "estudiante" as const,
  profile_image_url: "https://example.com/avatar.png",
  is_verified: true,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
};

const validMessageDecoration = {
  type: "mention" as const,
  data: { userId: "550e8400-e29b-41d4-a716-446655440001" },
};

const validMessageAttachment = {
  id: "660e8400-e29b-41d4-a716-446655440010",
  type: "pdf",
  url: "https://example.com/document.pdf",
  name: "document.pdf",
  size: 1024000,
  mimeType: "application/pdf",
};

const validMessageAttachmentDto = {
  id: "660e8400-e29b-41d4-a716-446655440010",
  type: "pdf",
  url: "https://example.com/document.pdf",
  name: "document.pdf",
  size: 1024000,
  mime_type: "application/pdf",
};

const validMessageReaction = {
  id: "770e8400-e29b-41d4-a716-446655440020",
  emoji: "👍",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  user: validUser,
  createdAt: "2026-05-14T12:00:00.000Z",
};

const validMessageReactionDto = {
  id: "770e8400-e29b-41d4-a716-446655440020",
  emoji: "👍",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  user: validUserDto,
  created_at: "2026-05-14T12:00:00.000Z",
};

const validMessage = {
  id: "880e8400-e29b-41d4-a716-446655440030",
  conversationId: "990e8400-e29b-41d4-a716-446655440040",
  senderId: "550e8400-e29b-41d4-a716-446655440000",
  sender: validUser,
  content: "Hola, ¿cómo estás?",
  type: "text" as const,
  decorations: [validMessageDecoration],
  attachments: [validMessageAttachment],
  reactions: [validMessageReaction],
  isEdited: false,
  editedAt: undefined,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
};

const validMessageDto = {
  id: "880e8400-e29b-41d4-a716-446655440030",
  conversation_id: "990e8400-e29b-41d4-a716-446655440040",
  sender_id: "550e8400-e29b-41d4-a716-446655440000",
  sender: validUserDto,
  content: "Hola, ¿cómo estás?",
  type: "text" as const,
  decorations: [validMessageDecoration],
  attachments: [validMessageAttachmentDto],
  reactions: [validMessageReactionDto],
  is_edited: false,
  edited_at: undefined,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
};

const validConversation = {
  id: "990e8400-e29b-41d4-a716-446655440040",
  type: "direct" as const,
  name: undefined,
  description: undefined,
  avatarUrl: undefined,
  participants: [validUser, { ...validUser, id: "550e8400-e29b-41d4-a716-446655440001" }],
  lastMessage: validMessage,
  lastMessageAt: "2026-05-14T12:00:00.000Z",
  messageCount: 15,
  unreadCount: 3,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
};

const validConversationDto = {
  id: "990e8400-e29b-41d4-a716-446655440040",
  type: "direct" as const,
  name: undefined,
  description: undefined,
  avatar_url: undefined,
  participants: [validUserDto, { ...validUserDto, id: "550e8400-e29b-41d4-a716-446655440001" }],
  last_message: validMessageDto,
  last_message_at: "2026-05-14T12:00:00.000Z",
  message_count: 15,
  unread_count: 3,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
};

describe("messaging.schema", () => {
  describe("MessageDecorationSchema", () => {
    it("accepts a valid MessageDecoration payload", () => {
      const result = MessageDecorationSchema.safeParse(validMessageDecoration);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("mention");
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageDecorationSchema>
        >();
      }
    });

    it("validates decoration type enum", () => {
      const validTypes = ["mention", "file", "reaction"];
      validTypes.forEach((type) => {
        const result = MessageDecorationSchema.safeParse({
          type: type as any,
          data: {},
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("MessageAttachmentSchema", () => {
    it("accepts a valid MessageAttachment payload", () => {
      const result = MessageAttachmentSchema.safeParse(validMessageAttachment);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("document.pdf");
        expect(result.data.mimeType).toBe("application/pdf");
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageAttachmentSchema>
        >();
      }
    });

    it("rejects attachment with invalid URL or negative size", () => {
      const invalidUrl = MessageAttachmentSchema.safeParse({
        ...validMessageAttachment,
        url: "not-a-url",
      });
      const negativeSize = MessageAttachmentSchema.safeParse({
        ...validMessageAttachment,
        size: -100,
      });

      expect(invalidUrl.success).toBe(false);
      expect(negativeSize.success).toBe(false);
    });
  });

  describe("MessageAttachmentDTOSchema", () => {
    it("accepts a valid MessageAttachment DTO payload", () => {
      const result = MessageAttachmentDTOSchema.safeParse(
        validMessageAttachmentDto
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("document.pdf");
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageAttachmentDTOSchema>
        >();
      }
    });

    it("transforms MessageAttachment DTO with snake_case to camelCase mapping", () => {
      const dtoResult = MessageAttachmentDTOSchema.safeParse(
        validMessageAttachmentDto
      );

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.mimeType).toBe("application/pdf");
      }
    });
  });

  describe("MessageReactionSchema", () => {
    it("accepts a valid MessageReaction payload", () => {
      const result = MessageReactionSchema.safeParse(validMessageReaction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emoji).toBe("👍");
        expect(result.data.user?.email).toBe(validUser.email);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageReactionSchema>
        >();
      }
    });

    it("rejects reaction with empty emoji or emoji exceeding length", () => {
      const emptyEmoji = MessageReactionSchema.safeParse({
        ...validMessageReaction,
        emoji: "",
      });
      const tooLongEmoji = MessageReactionSchema.safeParse({
        ...validMessageReaction,
        emoji: "🎉🎊🎈🎁🎀🎂🎃🎄🎅🎆",
      });

      expect(emptyEmoji.success).toBe(false);
      expect(tooLongEmoji.success).toBe(false);
    });
  });

  describe("MessageReactionDTOSchema", () => {
    it("accepts a valid MessageReaction DTO payload", () => {
      const result = MessageReactionDTOSchema.safeParse(validMessageReactionDto);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emoji).toBe("👍");
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageReactionDTOSchema>
        >();
      }
    });

    it("transforms MessageReaction DTO with snake_case to camelCase mapping", () => {
      const dtoResult = MessageReactionDTOSchema.safeParse(
        validMessageReactionDto
      );

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.userId).toBe(validMessageReactionDto.user_id);
        expect(transformed.createdAt).toBe(validMessageReactionDto.created_at);
      }
    });
  });

  describe("MessageSchema", () => {
    it("accepts a valid Message payload", () => {
      const result = MessageSchema.safeParse(validMessage);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Hola, ¿cómo estás?");
        expect(result.data.type).toBe("text");
        expect(result.data.isEdited).toBe(false);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageSchema>
        >();
      }
    });



    it("validates message type enum", () => {
      const validTypes = ["text", "file", "mention", "reaction"];
      validTypes.forEach((type) => {
        const result = MessageSchema.safeParse({
          ...validMessage,
          type: type as any,
        });
        expect(result.success).toBe(true);
      });

      const invalidType = MessageSchema.safeParse({
        ...validMessage,
        type: "audio" as any,
      });
      expect(invalidType.success).toBe(false);
    });

    it("accepts optional nested decorations, attachments, and reactions", () => {
      const messageWithoutNested = MessageSchema.safeParse({
        ...validMessage,
        decorations: undefined,
        attachments: undefined,
        reactions: undefined,
      });

      expect(messageWithoutNested.success).toBe(true);
    });
  });

  describe("MessageDTOSchema", () => {
    it("accepts a valid Message DTO payload", () => {
      const result = MessageDTOSchema.safeParse(validMessageDto);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Hola, ¿cómo estás?");
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof MessageDTOSchema>
        >();
      }
    });

    it("transforms Message DTO with snake_case to camelCase mapping", () => {
      const dtoResult = MessageDTOSchema.safeParse(validMessageDto);

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.conversationId).toBe(validMessageDto.conversation_id);
        expect(transformed.senderId).toBe(validMessageDto.sender_id);
        expect(transformed.isEdited).toBe(false);
        expect(transformed.createdAt).toBe(validMessageDto.created_at);
        expect(transformed.updatedAt).toBe(validMessageDto.updated_at);
      }
    });
  });

  describe("ConversationSchema", () => {
    it("accepts a valid Conversation payload", () => {
      const result = ConversationSchema.safeParse(validConversation);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("direct");
        expect(result.data.messageCount).toBe(15);
        expect(result.data.participants.length).toBe(2);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof ConversationSchema>
        >();
      }
    });

    it("rejects conversation with invalid message count", () => {
      const negativeCount = ConversationSchema.safeParse({
        ...validConversation,
        messageCount: -5,
      });
      const negativeUnread = ConversationSchema.safeParse({
        ...validConversation,
        unreadCount: -1,
      });

      expect(negativeCount.success).toBe(false);
      expect(negativeUnread.success).toBe(false);
    });

    it("validates conversation type enum", () => {
      const validTypes = ["direct", "group"];
      validTypes.forEach((type) => {
        const result = ConversationSchema.safeParse({
          ...validConversation,
          type: type as any,
        });
        expect(result.success).toBe(true);
      });

      const invalidType = ConversationSchema.safeParse({
        ...validConversation,
        type: "private" as any,
      });
      expect(invalidType.success).toBe(false);
    });

    it("accepts optional name, description, avatarUrl, and lastMessage", () => {
      const minimalConversation = ConversationSchema.safeParse({
        ...validConversation,
        name: undefined,
        description: undefined,
        avatarUrl: undefined,
        lastMessage: undefined,
        lastMessageAt: undefined,
      });

      expect(minimalConversation.success).toBe(true);
    });
  });

  describe("ConversationDTOSchema", () => {
    it("accepts a valid Conversation DTO payload", () => {
      const result = ConversationDTOSchema.safeParse(validConversationDto);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("direct");
        expect(result.data.message_count).toBe(15);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof ConversationDTOSchema>
        >();
      }
    });

    it("transforms Conversation DTO with snake_case to camelCase mapping", () => {
      const dtoResult = ConversationDTOSchema.safeParse(validConversationDto);

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.avatarUrl).toBe(validConversationDto.avatar_url);
        expect(transformed.messageCount).toBe(15);
        expect(transformed.unreadCount).toBe(3);
        expect(transformed.lastMessageAt).toBe(
          validConversationDto.last_message_at
        );
      }
    });
  });
});
