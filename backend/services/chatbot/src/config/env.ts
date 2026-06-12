import { requireEnv } from "../../../../shared/libs/config/requiredEnv.js";

export interface ChatbotEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly chatbotWebhookUrl: string;
}

export function loadChatbotEnv(source: NodeJS.ProcessEnv = process.env): ChatbotEnv {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(".env");
    }
  } catch {
    // Ignore missing .env file
  }

  const portRaw = requireEnv(source, "PORT");
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const chatbotWebhookUrl = source.CHATBOT_WEBHOOK_URL || "MOCK_URL";

  return {
    port,
    nodeEnv: requireEnv(source, "NODE_ENV"),
    chatbotWebhookUrl,
  };
}
