export type GroupStateEventType =
  | "ADMIN_TRANSFER_REQUESTED"
  | "ADMIN_TRANSFER_ACCEPTED"
  | "ADMIN_TRANSFER_REJECTED"
  | "ADMIN_TRANSFER_COMPLETED"
  | "ADMIN_ROLE_LEFT"
  | "GROUP_DISSOLVED"
  | "GROUP_BLOCKED";

export interface GroupStateEvent {
  type: GroupStateEventType;
  timestamp: string;
  requestId?: string;
  groupName?: string;
  oldAdminId?: string;
  newAdminId?: string;
  transferId?: string;
  actorUserId?: string;
}

export interface IGroupContext {
  requestId: string;
  groupName: string;
  adminId: string;
  targetUserId: string;
  transferId: string;
  adminCount: number;

  transitionTo(state: IState): void;
  emit(event: GroupStateEvent): Promise<void>;
  transitionToPendingTransfer(previousState: IState, targetUserId: string, transferId: string): void;
  transitionToTransferAccepted(parent: IState): void;
  transitionToActive(): void;
  transitionToDissolved(): void;
  transitionToBlocked(): void;
}

export interface IState {
  readonly stateName: string;
  setContext(context: IGroupContext): void;
  solicitar(): Promise<void>;
  aceptar(): Promise<void>;
  rechazar(): Promise<void>;
  transferir(): Promise<void>;
  leaveAdminRole(actorUserId: string): Promise<void>;
}
