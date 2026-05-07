/**
 * IStudyGroupState.ts
 * Interfaz que define el contrato para todos los estados del ciclo de vida del grupo.
 * Cada estado implementa los métodos de transición que son válidos en ese estado.
 */

export interface IStudyGroupState {
  /**
   * Solicita la transferencia del rol de admin del grupo
   */
  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void;

  /**
   * Acepta la transferencia del rol de admin pendiente
   */
  acceptAdminTransfer(groupId: string, transferId: string): void;

  /**
   * Rechaza la transferencia del rol de admin pendiente
   */
  rejectAdminTransfer(groupId: string, transferId: string): void;

  /**
   * Cierra el grupo de estudio
   */
  closeGroup(groupId: string): void;

  /**
   * Expira el grupo de estudio (por tiempo límite)
   */
  expireGroup(groupId: string): void;

  /**
   * Obtiene el nombre del estado actual
   */
  getStatusName(): string;
}
