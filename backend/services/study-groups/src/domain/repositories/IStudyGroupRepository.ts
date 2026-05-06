import type { StudyGroup } from "../states/StudyGroup.js";
import type { ISubject } from "../events/observers/ISubject.js";

/**
 * Contrato para reconstruir (hidratar) el contexto StudyGroup
 * con el estado correcto basándose en los datos persistidos en la BD.
 *
 * Separa la responsabilidad de hidratación del dominio de la infraestructura,
 * manteniendo la inversión de dependencias (Dependency Inversion Principle).
 */
export interface IStudyGroupRepository {
  /**
   * Carga un StudyGroup desde la BD con el estado correcto asignado:
   * - AbiertaState:              status='abierta' y membersCount < maxMembers
   * - LlenaState (virtual):     status='abierta' y membersCount >= maxMembers
   * - CerradaState:             status='cerrada'
   * - ExpiradaState:            status='expirada'
   * - TransferenciaPendienteState: envuelve el estado base si hay transferencia pendiente
   *
   * @throws Error si el grupo no existe
   */
  loadStudyGroup(requestId: string, subject: ISubject): Promise<StudyGroup>;
}
