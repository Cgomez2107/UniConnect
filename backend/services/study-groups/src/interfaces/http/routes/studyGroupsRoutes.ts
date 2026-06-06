import type { IncomingMessage, ServerResponse } from "node:http";

import type { StudyGroupsController } from "../controllers/StudyGroupsController.js";
import type { StudySessionsController } from "../controllers/StudySessionsController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export async function handleStudyGroupsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: StudyGroupsController,
  sessionsController?: StudySessionsController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const detailMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)$/);
  const membersMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/members$/);
  const applicationsMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/applications$/);
  const messagesMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/messages$/);
  const messageReactionsMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/messages\/([^/]+)\/reactions$/);
  const messagePollVoteMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/messages\/([^/]+)\/polls\/vote$/);
  const applyMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/apply$/);
  const leaveMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/leave$/);
  const cancelMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/cancel$/);
  const reviewMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/applications\/([^/]+)\/review$/);
  const cancelApplicationMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/applications\/([^/]+)\/cancel$/);
  const transferMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/transfer$/);
  const transferAcceptMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/transfers\/([^/]+)\/accept$/);
  const transferRejectMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/transfers\/([^/]+)\/reject$/);
  const sessionsMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/sessions$/);
  const sessionDetailMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/sessions\/([^/]+)$/);
  const sessionAvailabilityMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/sessions\/([^/]+)\/availability$/);
  const sessionAttendeesMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/sessions\/([^/]+)\/attendees$/);

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "study-groups",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/study-groups/me") {
    await controller.listMyStudyRequests(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/study-groups/applications") {
    await controller.listMyApplications(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/study-groups") {
    await controller.list(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/notifications") {
    await controller.listNotifications(req, res);
    return true;
  }

  if (req.method === "PUT" && requestUrl.pathname === "/api/v1/notifications/read-all") {
    await controller.markNotificationsRead(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/notifications/preferences") {
    await controller.getPreferences(req, res);
    return true;
  }

  if (req.method === "PUT" && requestUrl.pathname === "/api/v1/notifications/preferences") {
    await controller.updatePreference(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/study-groups") {
    await controller.create(req, res);
    return true;
  }

  if (req.method === "GET" && detailMatch) {
    await controller.getById(req, res, detailMatch[1]);
    return true;
  }

  if (req.method === "GET" && membersMatch) {
    await controller.listMembers(req, res, membersMatch[1]);
    return true;
  }

  if (req.method === "GET" && applicationsMatch) {
    await controller.listApplications(req, res, applicationsMatch[1]);
    return true;
  }

  if (req.method === "GET" && messagesMatch) {
    await controller.listMessages(req, res, messagesMatch[1]);
    return true;
  }

  if (req.method === "POST" && applyMatch) {
    await controller.apply(req, res, applyMatch[1]);
    return true;
  }

  if (req.method === "POST" && messagesMatch) {
    await controller.createMessage(req, res, messagesMatch[1]);
    return true;
  }

  if (req.method === "POST" && leaveMatch) {
    await controller.leaveAdmin(req, res, leaveMatch[1]);
    return true;
  }

  if (req.method === "POST" && cancelMatch) {
    await controller.cancelStudyRequest(req, res, cancelMatch[1]);
    return true;
  }

  if (req.method === "PUT" && reviewMatch) {
    await controller.review(req, res, reviewMatch[1]);
    return true;
  }

  if (req.method === "POST" && cancelApplicationMatch) {
    await controller.cancelMyApplication(req, res, cancelApplicationMatch[1]);
    return true;
  }

  if (req.method === "POST" && transferMatch) {
    await controller.requestTransfer(req, res, transferMatch[1]);
    return true;
  }

  if (req.method === "POST" && transferAcceptMatch) {
    await controller.acceptTransfer(req, res, transferAcceptMatch[1]);
    return true;
  }

  if (req.method === "POST" && transferRejectMatch) {
    await controller.rejectTransfer(req, res, transferRejectMatch[1]);
    return true;
  }

  if (req.method === "POST" && messageReactionsMatch) {
    await controller.toggleMessageReaction(req, res, messageReactionsMatch[2]);
    return true;
  }

  if (req.method === "POST" && messagePollVoteMatch) {
    await controller.voteInPollHandler(req, res, messagePollVoteMatch[2]);
    return true;
  }

  if (req.method === "GET" && sessionsMatch) {
    await controller.listSessions(req, res, sessionsMatch[1]);
    return true;
  }

  if (req.method === "POST" && sessionsMatch) {
    await controller.createSession(req, res, sessionsMatch[1]);
    return true;
  }

  if (req.method === "DELETE" && sessionDetailMatch) {
    await controller.cancelSession(req, res, sessionDetailMatch[2]);
    return true;
  }

  if (req.method === "POST" && sessionAvailabilityMatch) {
    await controller.updateAvailability(req, res, sessionAvailabilityMatch[2]);
    return true;
  }

  if (req.method === "GET" && sessionAttendeesMatch) {
    await controller.listSessionAttendees(req, res, sessionAttendeesMatch[2]);
    return true;
  }

  if (sessionsController) {
    const seriesMatch = requestUrl.pathname.match(
      /^\/api\/v1\/study-groups\/([^/]+)\/sessions\/series$/,
    );
    const listMatch = requestUrl.pathname.match(
      /^\/api\/v1\/study-groups\/([^/]+)\/sessions$/,
    );
    const cancelSessionMatch = requestUrl.pathname.match(
      /^\/api\/v1\/study-groups\/sessions\/([^/]+)$/,
    );
    const availabilityMatch = requestUrl.pathname.match(
      /^\/api\/v1\/study-groups\/sessions\/([^/]+)\/availability$/,
    );
    const attendeesMatch = requestUrl.pathname.match(
      /^\/api\/v1\/study-groups\/sessions\/([^/]+)\/attendees$/,
    );

    if (req.method === "POST" && seriesMatch) {
      await sessionsController.handleCreateSeries(req, res, seriesMatch[1]);
      return true;
    }

    if (req.method === "GET" && listMatch) {
      await sessionsController.handleListByGroup(req, res, listMatch[1]);
      return true;
    }

    if (req.method === "DELETE" && cancelSessionMatch) {
      await sessionsController.handleCancel(req, res, cancelSessionMatch[1]);
      return true;
    }

    if (req.method === "PATCH" && availabilityMatch) {
      await sessionsController.handleUpdateAvailability(req, res, availabilityMatch[1]);
      return true;
    }

    if (req.method === "GET" && attendeesMatch) {
      await sessionsController.handleListAttendees(req, res, attendeesMatch[1]);
      return true;
    }
  }

  return false;
}
