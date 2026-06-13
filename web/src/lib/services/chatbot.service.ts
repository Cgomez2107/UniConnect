import { deps } from "@/store/deps";
import type { SendChatbotMessageResponse } from "@uniconnect/shared-types";

const chatbotService = {
  async sendMessageToChatbot(
    message: string,
    history?: { role: "user" | "assistant"; content: string }[],
    signal?: AbortSignal
  ): Promise<SendChatbotMessageResponse> {
    return deps.apiClients.chatbot.sendMessage(
      { body: { message, history } },
      { signal }
    );
  },
};

export default chatbotService;
