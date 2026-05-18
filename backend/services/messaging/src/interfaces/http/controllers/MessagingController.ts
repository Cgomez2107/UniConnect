import type { IncomingMessage, ServerResponse } from "node:http";
import { z, ZodError } from "zod";

import { GetConversationById } from "../../../application/use-cases/GetConversationById.js";
import { GetConversations } from "../../../application/use-cases/GetConversations.js";
import { GetMessageById } from "../../../application/use-cases/GetMessageById.js";
import { GetOrCreateConversation } from "../../../application/use-cases/GetOrCreateConversation.js";
import { ListMessages } from "../../../application/use-cases/ListMessages.js";
import { GetUnreadCount } from "../../../application/use-cases/GetUnreadCount.js";
import { MarkMessageAsRead } from "../../../application/use-cases/MarkMessageAsRead.js";
import { MarkConversationAsRead } from "../../../application/use-cases/MarkConversationAsRead.js";
import { SendMessage } from "../../../application/use-cases/SendMessage.js";
import { TouchConversation } from "../../../application/use-cases/TouchConversation.js";
import { ToggleReaction } from "../../../application/use-cases/ToggleReaction.js";
import type { ConversationSummary } from "../../../domain/entities/Conversation.js";
import type { Message } from "../../../domain/entities/Message.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { ContentError } from "../../../../../../shared/libs/errors/ContentError.js";
import { SizeError } from "../../../../../../shared/libs/errors/SizeError.js";
import { MediaError } from "../../../../../../shared/libs/errors/MediaError.js";
import { sendJson, sendData, sendError } from "../../../../../../shared/http/sendJson.js";

const CreateConversationBodySchema = z.object({
  participantB: z.string().min(1, "participantB es requerido"),
});

const CreateMessageBodySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().optional().default(""),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  mediaFilename: z.string().optional(),
  replyToMessageId: z.string().optional(),
  replyPreview: z.string().optional(),
});

function toApiConversation(conversation: ConversationSummary) {
  return {
    id: conversation.id,
    participant_a: conversation.participantA,
    participant_b: conversation.participantB,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
    other_user_id: conversation.otherUserId,
    other_user_name: conversation.otherUserName,
    other_user_avatar: conversation.otherUserAvatar,
    last_message: conversation.lastMessage,
    last_message_at: conversation.lastMessageAt,
    unread_count: conversation.unreadCount,
  };
}

function toApiMessage(message: Message) {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    content: message.content,
    media_url: message.mediaUrl,
    media_type: message.mediaType,
    media_filename: message.mediaFilename,
    reply_to_message_id: message.replyToMessageId,
    reply_preview: message.replyPreview,
    created_at: message.createdAt,
    read_at: message.readAt,
    reactions: message.reactions ?? [],
    sender: message.sender
      ? {
          full_name: message.sender.fullName,
          avatar_url: message.sender.avatarUrl,
        }
      : null,
  };
}

export class MessagingController {
  constructor(
    private readonly getConversationsUseCase: GetConversations,
    private readonly getConversationByIdUseCase: GetConversationById,
    private readonly getOrCreateConversationUseCase: GetOrCreateConversation,
    private readonly touchConversationUseCase: TouchConversation,
    private readonly getMessageByIdUseCase: GetMessageById,
    private readonly listMessagesUseCase: ListMessages,
    private readonly getUnreadCountUseCase: GetUnreadCount,
    private readonly sendMessageUseCase: SendMessage,
    private readonly markMessageAsReadUseCase: MarkMessageAsRead,
    private readonly markConversationAsReadUseCase: MarkConversationAsRead,
    private readonly toggleReactionUseCase: ToggleReaction,
  ) {}

  async listConversations(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const conversations = await this.getConversationsUseCase.execute(actorUserId);
      sendData(res, 200, conversations.map(toApiConversation));
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getConversationById(req: IncomingMessage, res: ServerResponse, conversationId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const conversation = await this.getConversationByIdUseCase.execute(conversationId, actorUserId);
      if (!conversation) {
        sendError(res, 404, "Conversacion no encontrada.");
        return;
      }

      sendData(res, 200, toApiConversation(conversation));
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getOrCreateConversation(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = await readJsonBody(req);
      const parsed = CreateConversationBodySchema.parse(body);
      const conversation = await this.getOrCreateConversationUseCase.execute(
        actorUserId,
        parsed.participantB,
      );

      sendData(res, 201, toApiConversation(conversation));
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Error de validación: el campo 'participantB' es requerido.");
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async touchConversation(req: IncomingMessage, res: ServerResponse, conversationId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      await this.touchConversationUseCase.execute(conversationId, actorUserId);
      sendData(res, 200, { message: "Conversacion actualizada." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getMessageById(req: IncomingMessage, res: ServerResponse, messageId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const message = await this.getMessageByIdUseCase.execute(messageId, actorUserId);
      if (!message) {
        sendError(res, 404, "Mensaje no encontrado.");
        return;
      }

      sendData(res, 200, toApiMessage(message));
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listMessages(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const requestUrl = new URL(req.url ?? "/", "http://localhost");
      const conversationId = requestUrl.searchParams.get("conversationId") ?? "";
      const limit = Number(requestUrl.searchParams.get("limit") ?? "50");
      const offset = Number(requestUrl.searchParams.get("offset") ?? "0");

      const messages = await this.listMessagesUseCase.execute(conversationId, actorUserId, limit, offset);
      sendData(res, 200, messages.map(toApiMessage));
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getUnreadCount(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const count = await this.getUnreadCountUseCase.execute(actorUserId);
      sendData(res, 200, { count });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async createMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = await readJsonBody(req);
      const parsed = CreateMessageBodySchema.parse(body);

      const message = await this.sendMessageUseCase.execute(
        parsed.conversationId,
        actorUserId,
        parsed.content,
        {
          mediaUrl: parsed.mediaUrl,
          mediaType: parsed.mediaType,
          mediaFilename: parsed.mediaFilename,
          replyToMessageId: parsed.replyToMessageId,
          replyPreview: parsed.replyPreview,
        },
      );

      sendData(res, 201, toApiMessage(message));
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Error de validación: el campo 'conversationId' es requerido.");
        return;
      }
      if (error instanceof ContentError || error instanceof SizeError || error instanceof MediaError) {
        sendJson(res, error.statusCode, { error: error.message, reason: error.reason, name: error.name });
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async toggleReaction(req: IncomingMessage, res: ServerResponse, messageId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = await readJsonBody<{ emoji: string }>(req);
      if (!body.emoji) {
        sendError(res, 400, "El campo 'emoji' es requerido.");
        return;
      }

      const { conversationId, reactions } = await this.toggleReactionUseCase.execute(messageId, actorUserId, body.emoji);
      sendData(res, 200, { conversation_id: conversationId, message_id: messageId, reactions });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async markMessageAsRead(req: IncomingMessage, res: ServerResponse, messageId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const updated = await this.markMessageAsReadUseCase.execute(messageId, actorUserId);
      if (!updated) {
        sendError(res, 404, "Mensaje no encontrado.");
        return;
      }

      sendData(res, 200, { message: "Mensaje actualizado." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async markConversationAsRead(req: IncomingMessage, res: ServerResponse, conversationId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const count = await this.markConversationAsReadUseCase.execute(conversationId, actorUserId);
      sendData(res, 200, { count, message: "Conversacion actualizada." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
