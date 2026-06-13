import { createServer } from "node:http";
import { loadChatbotEnv } from "./config/env.js";
import { SendMessageUseCase } from "./application/use-cases/SendMessageUseCase.js";
import { ChatbotController } from "./interfaces/http/controllers/ChatbotController.js";
import { handleChatbotRoutes } from "./interfaces/http/routes/chatbotRoutes.js";
import { Database } from "./infrastructure/database/Database.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message, statusCode });
}

function bootstrap(): void {
  const env = loadChatbotEnv();

  // Initialize Database Pool
  try {
    Database.getInstance(env);
  } catch (err: any) {
    console.error(`[Database Init Error] ${err.message}`);
  }

  const sendMessageUseCase = new SendMessageUseCase();
  const controller = new ChatbotController(sendMessageUseCase);

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleChatbotRoutes(req, res, controller);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"));
    });
  });

  server.listen({ port: env.port, host: "::" }, () => {
    console.log(
      JSON.stringify({
        service: "chatbot",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "::",
        nodeEnv: env.nodeEnv,
      }),
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio chatbot...`);

    try {
      await Database.getInstance().close();
    } catch {
      // Ignore
    }

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap();
