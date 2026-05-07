/**
 * StudyGroupContext.ts
 * Contexto del patrón State
 * Esta clase mantiene una referencia al estado actual del grupo y delega las llamadas a los métodos
 * al estado actual. El estado actual es responsable de ejecutar la lógica y decidir las transiciones.
 */

import type { IStudyGroupState } from "./IStudyGroupState.js";
import { AbiertaState } from "./AbiertaState.js";
import { LlenaState } from "./LlenaState.js";
import { TransferenciaPendienteState } from "./TransferenciaPendienteState.js";
import { CerradaState } from "./CerradaState.js";
import { ExpiradaState } from "./ExpiradaState.js";

export class StudyGroupContext {
  private currentState: IStudyGroupState;

  constructor(
    private readonly groupId: string,
    initialStatus: string = "abierta",
  ) {
    this.currentState = this.initializeState(initialStatus);
  }

  /**
   * Inicializa el estado basado en el status string
   */
  private initializeState(status: string): IStudyGroupState {
    switch (status) {
      case "abierta":
        return new AbiertaState(this);
      case "llena":
        return new LlenaState(this);
      case "transferenciaPendiente":
        return new TransferenciaPendienteState(this);
      case "cerrada":
        return new CerradaState(this);
      case "expirada":
        return new ExpiradaState(this);
      default:
        return new AbiertaState(this);
    }
  }

  /**
   * Transiciona a un nuevo estado
   */
  transitionTo(newStatus: string): void {
    console.log(
      `[StudyGroupContext] Transicionando grupo ${this.groupId} a estado: ${newStatus}`,
    );
    this.currentState = this.initializeState(newStatus);
  }

  /**
   * Obtiene el estado actual
   */
  getCurrentState(): IStudyGroupState {
    return this.currentState;
  }

  /**
   * Obtiene el nombre del estado actual
   */
  getStatusName(): string {
    return this.currentState.getStatusName();
  }

  /**
   * Delega al estado actual
   */
  requestAdminTransfer(actorUserId: string, targetUserId: string): void {
    this.currentState.requestAdminTransfer(this.groupId, actorUserId, targetUserId);
  }

  /**
   * Delega al estado actual
   */
  acceptAdminTransfer(transferId: string): void {
    this.currentState.acceptAdminTransfer(this.groupId, transferId);
  }

  /**
   * Delega al estado actual
   */
  rejectAdminTransfer(transferId: string): void {
    this.currentState.rejectAdminTransfer(this.groupId, transferId);
  }

  /**
   * Delega al estado actual
   */
  closeGroup(): void {
    this.currentState.closeGroup(this.groupId);
  }

  /**
   * Delega al estado actual
   */
  expireGroup(): void {
    this.currentState.expireGroup(this.groupId);
  }
}
