import type { IncomingMessage } from "node:http";
import { getActorUserId } from "./getActorUserId.js";
import { getActorUserRole } from "./getActorUserRole.js";
import type { IPermissionValidator } from "../../../domain/services/IPermissionValidator.js";

export interface EditGuardResult {
  actorUserId: string;
  isAdmin: boolean;
}

export async function checkEditPermission(
  req: IncomingMessage,
  resourceId: string,
  permissionValidator: IPermissionValidator,
): Promise<EditGuardResult | null> {
  const actorUserId = getActorUserId(req);
  if (!actorUserId) return null;

  const role = getActorUserRole(req);
  const isAdmin = role === "admin";

  // Check if user is the owner or has permission
  const canEdit = await permissionValidator.canEditResource(resourceId, actorUserId);
  if (!canEdit && !isAdmin) {
    return null;
  }

  return { actorUserId, isAdmin };
}
