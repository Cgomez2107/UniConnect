import { apiClient } from "@/lib/api/client";
import type { SendChatbotMessageResponse } from "@uniconnect/shared-types";

const chatbotService = {
  async sendMessageToChatbot(
    message: string,
    history?: { role: "user" | "assistant"; content: string }[]
  ): Promise<SendChatbotMessageResponse> {
    const response = await apiClient.post<SendChatbotMessageResponse>("/chatbot/message", {
      message,
      history,
    });
    return response.data;
  },
};

export default chatbotService;
