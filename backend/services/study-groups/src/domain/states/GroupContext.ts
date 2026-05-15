import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import type { ISubject } from "../events/observers/ISubject.js";
import type { IState, IGroupContext } from "./IState.js";
import { PendingTransfer } from "./PendingTransfer.js";
import { TransferAccepted } from "./TransferAccepted.js";
import { Active } from "./Active.js";

export class GroupContext implements IGroupContext {
  private _state!: IState;

  adminId: string;
  targetUserId: string = "";
  transferId: string = "";
  adminCount: number;
  readonly membersCount: number = 0;
  readonly maxMembers: number = 0;

  constructor(
    public readonly requestId: string,
    public readonly groupName: string,
    adminId: string,
    initialState: IState,
    private readonly subject: ISubject,
    membersCount: number = 0,
    maxMembers: number = 0,
    adminCount: number = 1,
  ) {
    this.adminId = adminId;
    this.adminCount = adminCount;
    this.membersCount = membersCount;
    this.maxMembers = maxMembers;
    this.transitionTo(initialState);
  }

  transitionTo(state: IState): void {
    this._state = state;
    this._state.setContext(this);
  }

  emit(event: StudyGroupEvent): Promise<void> {
    return this.subject.emit(event);
  }

  transitionToPendingTransfer(previousState: IState, targetUserId: string, transferId: string): void {
    this._state = new PendingTransfer(previousState, targetUserId, transferId);
    this._state.setContext(this);
  }

  transitionToTransferAccepted(parent: IState): void {
    this._state = new TransferAccepted(parent);
    this._state.setContext(this);
  }

  transitionToActive(): void {
    this._state = new Active();
    this._state.setContext(this);
  }

  async requestAdminTransfer(targetUserId: string): Promise<void> {
    this.targetUserId = targetUserId;
    await this._state.solicitar();
  }

  async acceptAdminTransfer(transferId: string): Promise<void> {
    this.transferId = transferId;
    await this._state.aceptar();
  }

  async rejectAdminTransfer(): Promise<void> {
    await this._state.rechazar();
  }

  async transferAdmin(): Promise<void> {
    await this._state.transferir();
  }

  async leaveAdminRole(actorUserId: string): Promise<void> {
    await this._state.leaveAdminRole(actorUserId);
  }
}
