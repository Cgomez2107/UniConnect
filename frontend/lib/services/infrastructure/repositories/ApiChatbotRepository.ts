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
    history?: ChatMessageApi[],
    signal?: AbortSignal
  ): Promise<SendChatbotMessageResponse> {
    const response = await this.chatbotClient.sendMessage(
      {
        body: {
          message,
          history,
        },
      },
      {
        signal,
      }
    );
    return response;
  }
}
