import type { IChatObserver } from "../ChatSubject.js";
import type { ChatEvent, ChatChannel } from "../ChatEvents.js";
import type { NotificacionDTO } from "../../../../../../shared/patterns/strategy/INotificationStrategy.js";
import type { NotificationService } from "../../../../../../shared/patterns/strategy/NotificationService.js";
import type { IUserRepository } from "../../../../../../shared/patterns/strategy/IUserRepository.js";

function resolveRecipientId(channel: ChatChannel, senderId: string): string | null {
  if (!channel.startsWith("dm:")) return null;
  const parts = channel.split(":");
  return parts[1] === senderId ? parts[2] : parts[1];
}

export class ChatNotificationObserver implements IChatObserver {
  readonly name = "ChatNotificationObserver";

  constructor(
    private readonly notificationService: NotificationService,
    private readonly userRepository: IUserRepository,
  ) {}

  async handle(event: ChatEvent, channel: ChatChannel): Promise<void> {
    if (event.type !== "NUEVO_MENSAJE") return;

    const recipientId = resolveRecipientId(channel, event.senderId);
    if (!recipientId) return;

    const contact = await this.userRepository.getContactInfo(recipientId);
    if (!contact) return;

    const dto: NotificacionDTO = {
      userId: recipientId,
      type: "nuevo_mensaje",
      title: event.senderName,
      body: event.content,
      payload: {
        conversationId: event.conversationId,
        messageId: event.messageId,
        senderId: event.senderId,
        ...event.payload,
      },
      priority: "normal",
    };

    const resumen = await this.notificationService.notificar(dto);

    console.log(
      JSON.stringify({
        observer: this.name,
        event: event.type,
        recipientId,
        channel,
        dispatchResult: {
          total: resumen.total,
          exitosos: resumen.exitosos,
          fallidos: resumen.fallidos,
        },
      }),
    );
  }
}
