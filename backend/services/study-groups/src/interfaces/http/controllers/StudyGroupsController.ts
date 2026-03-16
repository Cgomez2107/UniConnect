import type { IncomingMessage, ServerResponse } from "node:http";

import { ApplyToStudyRequest } from "../../../application/use-cases/ApplyToStudyRequest.js";
import { CreateStudyRequest } from "../../../application/use-cases/CreateStudyRequest.js";
import { GetStudyRequestById } from "../../../application/use-cases/GetStudyRequestById.js";
import { ListApplicationsByRequest } from "../../../application/use-cases/ListApplicationsByRequest.js";
import { ListOpenStudyRequests } from "../../../application/use-cases/ListOpenStudyRequests.js";
import { ReviewApplication } from "../../../application/use-cases/ReviewApplication.js";
import type { ApplyToStudyGroupDto } from "../dto/ApplyToStudyGroupDto.js";
import type { CreateStudyGroupDto } from "../dto/CreateStudyGroupDto.js";
import type { ListStudyGroupsQueryDto } from "../dto/ListStudyGroupsQueryDto.js";
import type { ReviewApplicationDto } from "../dto/ReviewApplicationDto.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export class StudyGroupsController {
  constructor(
    private readonly listOpenStudyRequests: ListOpenStudyRequests,
    private readonly getStudyRequestById: GetStudyRequestById,
    private readonly createStudyRequest: CreateStudyRequest,
    private readonly listApplicationsByRequest: ListApplicationsByRequest,
    private readonly applyToStudyRequest: ApplyToStudyRequest,
    private readonly reviewApplication: ReviewApplication,
  ) {}

  async list(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const query: ListStudyGroupsQueryDto = {
      subjectId: requestUrl.searchParams.get("subjectId") ?? undefined,
      search: requestUrl.searchParams.get("search") ?? undefined,
    };

    const result = await this.listOpenStudyRequests.execute(query);
    sendJson(res, 200, {
      data: result,
      meta: {
        total: result.length,
      },
    });
  }

  async getById(_req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    const result = await this.getStudyRequestById.execute(id);

    if (!result) {
      sendJson(res, 404, {
        error: "Study request not found",
      });
      return;
    }

    sendJson(res, 200, {
      data: result,
    });
  }

  async create(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Missing x-user-id header" });
      return;
    }

    const body = await readJsonBody<CreateStudyGroupDto>(req);
    const created = await this.createStudyRequest.execute({
      actorUserId,
      subjectId: body.subjectId ?? "",
      title: body.title ?? "",
      description: body.description ?? "",
      maxMembers: body.maxMembers ?? Number.NaN,
    });

    sendJson(res, 201, { data: created });
  }

  async listApplications(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Missing x-user-id header" });
      return;
    }

    const applications = await this.listApplicationsByRequest.execute({ requestId, actorUserId });
    sendJson(res, 200, { data: applications, meta: { total: applications.length } });
  }

  async apply(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Missing x-user-id header" });
      return;
    }

    const body = await readJsonBody<ApplyToStudyGroupDto>(req);
    const created = await this.applyToStudyRequest.execute({
      requestId,
      applicantId: actorUserId,
      message: body.message ?? "",
    });

    sendJson(res, 201, { data: created });
  }

  async review(req: IncomingMessage, res: ServerResponse, applicationId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Missing x-user-id header" });
      return;
    }

    const body = await readJsonBody<ReviewApplicationDto>(req);
    if (body.status !== "aceptada" && body.status !== "rechazada") {
      sendJson(res, 422, { error: "Review status must be 'aceptada' or 'rechazada'" });
      return;
    }

    await this.reviewApplication.execute({
      applicationId,
      actorUserId,
      status: body.status,
    });

    sendJson(res, 200, { message: "Application reviewed" });
  }
}
