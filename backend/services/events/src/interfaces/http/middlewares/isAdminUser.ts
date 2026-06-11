import type { IncomingMessage } from "node:http";
import type { Pool } from "pg";
import { getActorUserId } from "./getActorUserId.js";

export async function isAdminUser(req: IncomingMessage, pool?: Pool): Promise<boolean> {
  const userRole = req.headers["x-user-role"];
  if (userRole && typeof userRole === "string") {
    const normalizedRole = userRole.trim().toLowerCase();
    return normalizedRole === "admin" || normalizedRole === "super_admin";
  }

  if (!pool) return false;

  const userId = getActorUserId(req);
  if (!userId) return false;

  try {
    const result = await pool.query("SELECT role FROM profiles WHERE id = $1", [userId]);
    return result.rows[0]?.role === "admin";
  } catch {
    return false;
  }
}
