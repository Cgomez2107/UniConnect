import type { IncomingMessage, ServerResponse } from "node:http";
import { CreateQuestion } from "../../../application/use-cases/CreateQuestion.js";
import { CreateAnswer } from "../../../application/use-cases/CreateAnswer.js";
import { CastVote } from "../../../application/use-cases/CastVote.js";
import { MarcarComoSolucion } from "../../../application/use-cases/MarcarComoSolucion.js";
import { ListQuestions } from "../../../application/use-cases/ListQuestions.js";
import { GetQuestionDetail } from "../../../application/use-cases/GetQuestionDetail.js";
import { ListAnswers } from "../../../application/use-cases/ListAnswers.js";
import { getActorUserId } from "./getActorUserId.js";
import { readJsonBody } from "./readJsonBody.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { ContentError } from "../../../../../../shared/libs/errors/ContentError.js";
import { sendJson, sendData, sendError } from "../../../../../../shared/http/sendJson.js";

interface CreateQuestionBody {
  subjectId?: string;
  title?: string;
  body?: string;
}

interface CreateAnswerBody {
  body?: string;
}

interface CastVoteBody {
  targetType?: string;
  targetId?: string;
  voteType?: string;
}

interface MarcarSolucionBody {
  answerId?: string;
}

export class ForumController {
  constructor(
    private readonly createQuestionUseCase: CreateQuestion,
    private readonly createAnswerUseCase: CreateAnswer,
    private readonly castVoteUseCase: CastVote,
    private readonly marcarComoSolucionUseCase: MarcarComoSolucion,
    private readonly listQuestionsUseCase: ListQuestions,
    private readonly getQuestionDetailUseCase: GetQuestionDetail,
    private readonly listAnswersUseCase: ListAnswers,
  ) {}

  async createQuestion(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = (req as any).__validatedBody ?? await readJsonBody<CreateQuestionBody>(req);
      const question = await this.createQuestionUseCase.execute({
        userId: actorUserId,
        subjectId: body.subjectId ?? "",
        title: body.title ?? "",
        body: body.body ?? "",
      });

      sendData(res, 201, question);
    } catch (error) {
      if (error instanceof ContentError) {
        sendJson(res, error.statusCode, { error: error.message, reason: error.reason, name: error.name });
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listQuestions(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const requestUrl = new URL(req.url ?? "/", "http://localhost");
      const subjectId = requestUrl.searchParams.get("subjectId") ?? "";
      const page = Number(requestUrl.searchParams.get("page") ?? "1");
      const limit = Number(requestUrl.searchParams.get("limit") ?? "20");

      const questions = await this.listQuestionsUseCase.execute({ subjectId, page, limit });
      sendData(res, 200, questions);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getQuestionDetail(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const detail = await this.getQuestionDetailUseCase.execute(id);
      sendData(res, 200, detail);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async createAnswer(req: IncomingMessage, res: ServerResponse, questionId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = (req as any).__validatedBody ?? await readJsonBody<CreateAnswerBody>(req);
      const answer = await this.createAnswerUseCase.execute({
        questionId,
        userId: actorUserId,
        body: body.body ?? "",
      });

      sendData(res, 201, answer);
    } catch (error) {
      if (error instanceof ContentError) {
        sendJson(res, error.statusCode, { error: error.message, reason: error.reason, name: error.name });
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listAnswers(req: IncomingMessage, res: ServerResponse, questionId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const answers = await this.listAnswersUseCase.execute(questionId);
      sendData(res, 200, answers);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async castVote(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = (req as any).__validatedBody ?? await readJsonBody<CastVoteBody>(req);
      const voteCount = await this.castVoteUseCase.execute({
        targetType: body.targetType as 'question' | 'answer',
        targetId: body.targetId ?? "",
        voterId: actorUserId,
        voteType: body.voteType as 'upvote' | 'downvote',
      });

      sendData(res, 200, { voteCount });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async marcarComoSolucion(req: IncomingMessage, res: ServerResponse, questionId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = (req as any).__validatedBody ?? await readJsonBody<MarcarSolucionBody>(req);
      await this.marcarComoSolucionUseCase.execute({
        questionId,
        answerId: body.answerId ?? "",
        userId: actorUserId,
      });

      sendData(res, 200, { message: "Respuesta marcada como solución." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
