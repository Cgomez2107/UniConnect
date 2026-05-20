import type { IncomingMessage, ServerResponse } from "node:http";
import { z, ZodError } from "zod";

import { CreatePollUseCase } from "../../../application/use-cases/CreatePollUseCase.js";
import { CastVoteUseCase } from "../../../application/use-cases/CastVoteUseCase.js";
import { GetPollResultsUseCase } from "../../../application/use-cases/GetPollResultsUseCase.js";
import { DuplicateVoteError } from "../../../domain/errors/DuplicateVoteError.js";
import { PollClosedError } from "../../../domain/errors/PollClosedError.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";

const CreatePollBodySchema = z.object({
  messageId: z.string().min(1, "messageId es requerido"),
  groupId: z.string().min(1, "groupId es requerido"),
  question: z.string().min(5).max(500, "question debe tener entre 5 y 500 caracteres"),
  options: z.array(z.string().min(1)).min(2).max(10, "options debe tener entre 2 y 10 opciones"),
  expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "expiresAt debe ser una fecha ISO 8601 válida",
  }),
});

const CastVoteBodySchema = z.object({
  selectedOption: z.number().int().min(0, "selectedOption debe ser un entero >= 0"),
});

export class PollController {
  constructor(
    private readonly createPollUseCase: CreatePollUseCase,
    private readonly castVoteUseCase: CastVoteUseCase,
    private readonly getPollResultsUseCase: GetPollResultsUseCase,
  ) {}

  async createPollMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = await readJsonBody(req);
      const parsed = CreatePollBodySchema.parse(body);

      const poll = await this.createPollUseCase.execute({
        messageId: parsed.messageId,
        groupId: parsed.groupId,
        createdBy: actorUserId,
        question: parsed.question,
        options: parsed.options,
        expiresAt: parsed.expiresAt,
      });

      sendData(res, 201, poll);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, `Error de validación: ${error.errors.map((e) => e.message).join(", ")}`);
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async castVote(req: IncomingMessage, res: ServerResponse, pollId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = await readJsonBody(req);
      const parsed = CastVoteBodySchema.parse(body);

      const result = await this.castVoteUseCase.execute(
        pollId,
        actorUserId,
        parsed.selectedOption,
      );

      sendData(res, 200, result);
    } catch (error) {
      if (error instanceof DuplicateVoteError) {
        sendData(res, 400, { success: false, error: error.message, code: error.code });
        return;
      }
      if (error instanceof PollClosedError) {
        sendData(res, 400, { success: false, error: error.message, code: error.code });
        return;
      }
      if (error instanceof ZodError) {
        sendError(res, 400, `Error de validación: ${error.errors.map((e) => e.message).join(", ")}`);
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getPollResults(req: IncomingMessage, res: ServerResponse, pollId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const results = await this.getPollResultsUseCase.execute(pollId);
      sendData(res, 200, results);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
