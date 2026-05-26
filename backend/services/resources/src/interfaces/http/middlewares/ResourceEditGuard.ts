import type { IncomingMessage } from "node:http";
import { getActorUserId } from "./getActorUserId.js";
import { getActorUserRole } from "./getActorUserRole.js";

export interface EditGuardResult {
  actorUserId: string;
  isAdmin: boolean;
}

export function checkEditPermission(req: IncomingMessage): EditGuardResult | null {
  const actorUserId = getActorUserId(req);
  if (!actorUserId) return null;

  const role = getActorUserRole(req);
  const isAdmin = role === "admin";

  return { actorUserId, isAdmin };
}
