/**
 * @deprecated Use deps.apiClients.messaging directly or import from @uniconnect/shared-api
 * This file is kept as a thin adapter for backward compatibility.
 * New code should use the BaseMessagingClient from the shared-api package.
 */
import { deps } from "@/store/deps";
import type { ConversationUI, MessageUI } from "@/types/ui";

function mapConversation(conv: any): ConversationUI {
  return {
    id: conv.id,
    participantA: conv.participantA,
    participantB: conv.participantB,
    createdAt: conv.createdAt?.toISOString?.() ?? conv.createdAt,
    updatedAt: conv.updatedAt?.toISOString?.() ?? conv.updatedAt,
    otherUserId: conv.otherUserId ?? "",
    otherUserName: conv.otherUserName ?? "",
    otherUserAvatar: conv.otherUserAvatar ?? null,
    lastMessage: conv.lastMessage ?? null,
    lastMessageAt: conv.lastMessageAt?.toISOString?.() ?? conv.lastMessageAt ?? null,
    unreadCount: conv.unreadCount ?? 0,
  };
}

function mapMessage(msg: any): MessageUI {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    content: msg.content,
    mediaUrl: msg.mediaUrl ?? null,
    mediaType: msg.mediaType ?? null,
    mediaFilename: msg.mediaFilename ?? null,
    replyToMessageId: msg.replyToMessageId ?? null,
    replyPreview: msg.replyPreview ?? null,
    createdAt: msg.createdAt?.toISOString?.() ?? msg.createdAt,
    readAt: msg.readAt?.toISOString?.() ?? msg.readAt ?? null,
    sender: msg.sender
      ? { fullName: msg.sender.fullName, avatarUrl: msg.sender.avatarUrl ?? null }
      : undefined,
  };
}

const messagingService = {
  async getConversations(): Promise<ConversationUI[]> {
    const convs = await deps.apiClients.messaging.getConversations({ limit: 50 });
    return convs.map(mapConversation);
  },

  async getConversationById(id: string): Promise<ConversationUI> {
    const conv = await deps.apiClients.messaging.getConversation(id);
    return mapConversation(conv);
  },

  async createConversation(participantId: string): Promise<ConversationUI> {
    const conv = await deps.apiClients.messaging.createConversation(participantId);
    return mapConversation(conv);
  },

  async getMessages(conversationId: string): Promise<MessageUI[]> {
    const msgs = await deps.apiClients.messaging.getMessages({ conversationId, limit: 50 });
    return msgs.map(mapMessage);
  },

  async sendMessage(
    conversationId: string,
    content: string,
    options?: { replyToMessageId?: string; mediaUrl?: string; mediaType?: string }
  ): Promise<MessageUI> {
    const msg = await deps.apiClients.messaging.sendMessage({
      conversationId,
      content,
      ...(options?.replyToMessageId && { replyToMessageId: options.replyToMessageId }),
      ...(options?.mediaUrl && { mediaUrl: options.mediaUrl }),
      ...(options?.mediaType && { mediaType: options.mediaType }),
    });
    return mapMessage(msg);
  },

  async markAsRead(conversationId: string): Promise<void> {
    await deps.apiClients.messaging.markConversationAsRead(conversationId);
  },
};

export default messagingService;
