import type { IncomingMessage } from "node:http";

/**
 * Middleware para verificar que el usuario es admin
 * Solo admins pueden crear/editar/borrar eventos
 * Nota: para MVP, asumimos que el frontend valida esto.
 * En producción, validarías un rol en el JWT
 */
export function isAdminUser(_req: IncomingMessage): boolean {
  // TODO: implementar validación de rol cuando auth esté migrado
  // Por ahora: cualquiera puede crear eventos (seguridad débil para MVP)
  return true;
}
