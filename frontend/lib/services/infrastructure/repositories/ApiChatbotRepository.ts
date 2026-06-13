import { fetchApi } from "@/lib/api/httpClient";
import type { SendChatbotMessageResponse } from "@uniconnect/shared-types";

export interface ChatMessageApi {
  role: "user" | "assistant";
  content: string;
}

export class ApiChatbotRepository {
  async sendMessage(
    message: string,
    history?: ChatMessageApi[]
  ): Promise<SendChatbotMessageResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetchApi<SendChatbotMessageResponse>("/chatbot/message", {
        method: "POST",
        body: JSON.stringify({
          message,
          history,
        }),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
