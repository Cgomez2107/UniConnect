import { ChatbotClient } from "@/lib/api/ChatbotClient";
import type { SendChatbotMessageResponse } from "@uniconnect/shared-types";

export interface ChatMessageApi {
  role: "user" | "assistant";
  content: string;
}

export class ApiChatbotRepository {
  private readonly chatbotClient = new ChatbotClient();

  async sendMessage(
    message: string,
    history?: ChatMessageApi[]
  ): Promise<SendChatbotMessageResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await this.chatbotClient.sendMessage(
        {
          body: {
            message,
            history,
          },
        },
        {
          signal: controller.signal,
        }
      );
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
