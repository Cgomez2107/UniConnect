import type { IncomingMessage, ServerResponse } from "node:http";
import type { ProfilesCatalogController } from "../controllers/ProfilesCatalogController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": new TextEncoder().encode(body).byteLength.toString(),
  });
  res.end(body);
}

/**
 * Router HTTP para profiles-catalog
 * Matching de rutas con regex
 */
export async function handleProfilesCatalogRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: ProfilesCatalogController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const studentDetailMatch = requestUrl.pathname.match(
    /^\/api\/v1\/students\/([^/]+)$/,
  );
  const perfilMatch = requestUrl.pathname.match(/^\/perfil\/([^/]+)$/);
  const subjectsMatch = requestUrl.pathname.match(
    /^\/api\/v1\/catalog\/programs\/([^/]+)\/subjects$/,
  );

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "profiles-catalog",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/students/me") {
    await controller.getMyProfile(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/students/profile") {
    await controller.createProfile(req, res);
    return true;
  }

  if (req.method === "PATCH" && requestUrl.pathname === "/api/v1/students/me") {
    await controller.updateProfile(req, res);
    return true;
  }

  if (req.method === "PATCH" && requestUrl.pathname === "/api/v1/students/me/primary-program") {
    await controller.setPrimaryProgram(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/students/me/programs") {
    await controller.getMyPrograms(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/students/me/subjects") {
    await controller.getMySubjects(req, res);
    return true;
  }

  const removeSubjectMatch = requestUrl.pathname.match(
    /^\/api\/v1\/students\/me\/subjects\/([^/]+)$/,
  );

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/students/me/subjects") {
    await controller.addMySubject(req, res);
    return true;
  }

  if (req.method === "DELETE" && removeSubjectMatch) {
    await controller.removeMySubject(req, res, removeSubjectMatch[1]);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/students/me/avatar") {
    await controller.uploadAvatar(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/students") {
    await controller.searchStudents(req, res);
    return true;
  }

  if (req.method === "GET" && studentDetailMatch) {
    await controller.getStudentProfile(req, res, studentDetailMatch[1]);
    return true;
  }

  // Alias para cumplir AC4: endpoint público `/perfil/:id`
  if (req.method === "GET" && perfilMatch) {
    await controller.getStudentProfile(req, res, perfilMatch[1]);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/catalog/programs") {
    await controller.getPrograms(req, res);
    return true;
  }

  if (req.method === "GET" && subjectsMatch) {
    await controller.getSubjectsByProgram(req, res, subjectsMatch[1]);
    return true;
  }

  return false;
}
