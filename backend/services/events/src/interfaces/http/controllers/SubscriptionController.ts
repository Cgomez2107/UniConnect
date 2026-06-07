import type { IncomingMessage, ServerResponse } from "node:http";
import type { ISubscriptionRepository } from "../../../domain/events/subscriptions/ISubscriptionRepository.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

export class SubscriptionController {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async getSubscriptions(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      const categories = await this.subscriptionRepository.getUserSubscriptions(actorUserId);
      sendData(res, 200, { userId: actorUserId, categories });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async subscribe(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      const body = await readJsonBody<{ categoria?: string }>(req);
      const categoria = body.categoria?.trim();

      if (!categoria) {
        sendError(res, 400, "Categoria invalida. Debes especificar una categoría.");
        return;
      }

      await this.subscriptionRepository.subscribe(actorUserId, categoria);
      // Creación de recurso: devolvemos 201 Created
      sendData(res, 201, { success: true, message: `Suscrito a ${categoria}` });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async unsubscribe(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      const body = await readJsonBody<{ categoria?: string }>(req);
      const categoria = body.categoria?.trim();

      if (!categoria) {
        sendError(res, 400, "Categoria invalida. Debes especificar una categoría.");
        return;
      }

      await this.subscriptionRepository.unsubscribe(actorUserId, categoria);
      sendData(res, 200, { success: true, message: `Desuscrito de ${categoria}` });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
