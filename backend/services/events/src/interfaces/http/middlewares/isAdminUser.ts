import type { IncomingMessage } from "node:http";
import type { Pool } from "pg";
import { getActorUserId } from "./getActorUserId.js";

/**
 * Verifica que el usuario autenticado tenga rol de admin o super_admin
 * consultando la tabla profiles.
 */
export async function isAdminUser(req: IncomingMessage, pool?: Pool): Promise<boolean> {
  const userId = getActorUserId(req);
  if (!userId || !pool) return false;

  try {
    const result = await pool.query<{ role: string }>(
      `SELECT role FROM profiles WHERE id = $1`,
      [userId],
    );
    const role = result.rows[0]?.role;
    return role === "admin" || role === "super_admin";
  } catch {
    return false;
  }
}
