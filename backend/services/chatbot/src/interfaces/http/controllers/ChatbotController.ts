import type { IncomingMessage, ServerResponse } from "node:http";
import { SendMessageUseCase } from "../../../application/use-cases/SendMessageUseCase.js";
import { getActorUserRole } from "../middlewares/getActorUserRole.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export class ChatbotController {
  constructor(private sendMessageUseCase: SendMessageUseCase) {}

  async sendMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const role = getActorUserRole(req);
    if (!role) {
      sendJson(res, 401, { error: "UNAUTHORIZED", message: "Rol de usuario no encontrado en la sesión." });
      return;
    }

    const body = (req as any).__validatedBody;
    const { message, history } = body;

    try {
      const result = await this.sendMessageUseCase.execute(role, message, history);
      sendJson(res, 200, result);
    } catch (error: any) {
      console.error(`[ChatbotController Error] ${error.message}`);
      sendJson(res, 500, { error: "SERVER_ERROR", message: error.message || "Error interno del servidor." });
    }
  }
}
