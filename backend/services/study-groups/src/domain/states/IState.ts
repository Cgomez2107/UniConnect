import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";

export interface IGroupContext {
  readonly requestId: string;
  readonly groupName: string;
  adminId: string;
  targetUserId: string;
  transferId: string;
  adminCount: number;

  transitionTo(state: IState): void;
  emit(event: StudyGroupEvent): Promise<void>;
}

export interface IState {
  setContext(context: IGroupContext): void;

  solicitar(): Promise<void>;
  aceptar(): Promise<void>;
  rechazar(): Promise<void>;
  transferir(): Promise<void>;
  leaveAdminRole(actorUserId: string): Promise<void>;
}
