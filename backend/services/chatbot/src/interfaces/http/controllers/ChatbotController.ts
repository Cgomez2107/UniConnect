import type { IncomingMessage, ServerResponse } from "node:http";
import { SendMessageUseCase } from "../../../application/use-cases/SendMessageUseCase.js";
import { getActorUserRole } from "../middlewares/getActorUserRole.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { Database } from "../../../infrastructure/database/Database.js";

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
    const userId = getActorUserId(req);
    let role: string | null = null;

    if (userId) {
      try {
        const db = Database.getInstance();
        const result = await db.getPool().query("SELECT role FROM profiles WHERE id = $1", [userId]);
        if (result.rows[0]?.role) {
          role = result.rows[0].role;
        }
      } catch (err: any) {
        console.warn(`[ChatbotController DB Fallback] Failed to fetch role from DB for user ${userId}: ${err.message}`);
      }
    }

    // Fallback to token/header role if DB query didn't yield a role
    if (!role) {
      role = getActorUserRole(req);
    }

    // Default to estudiante if the user is authenticated but no role was found
    if (!role && userId) {
      role = "estudiante";
    }

    if (!role) {
      sendJson(res, 401, { error: "UNAUTHORIZED", message: "Rol de usuario no encontrado." });
      return;
    }

    const body = (req as any).__validatedBody;
    const { message, history } = body;

    try {
      const result = await this.sendMessageUseCase.execute(role, message, history, userId || undefined);
      sendJson(res, 200, result);
    } catch (error: any) {
      console.error(`[ChatbotController Error] ${error.message}`);
      sendJson(res, 500, { error: "SERVER_ERROR", message: error.message || "Error interno del servidor." });
    }
  }
}
