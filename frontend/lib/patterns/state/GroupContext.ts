import type { IState, IGroupContext, GroupStateEvent } from "./IState";
import { PendingTransfer } from "./PendingTransfer";
import { TransferAccepted } from "./TransferAccepted";
import { Active } from "./Active";
import { Dissolved } from "./Dissolved";
import { Blocked } from "./Blocked";

export type StateEventListener = (event: GroupStateEvent) => Promise<void> | void;

export class GroupContext implements IGroupContext {
  private _state!: IState;
  private listeners: Set<StateEventListener> = new Set();

  adminId: string;
  targetUserId: string = "";
  transferId: string = "";
  adminCount: number;

  constructor(
    public readonly requestId: string,
    public readonly groupName: string,
    adminId: string,
    initialState?: IState,
    adminCount: number = 1,
  ) {
    this.adminId = adminId;
    this.adminCount = adminCount;
    this.transitionTo(initialState ?? new Active());
  }

  get currentState(): IState {
    return this._state;
  }

  get stateName(): string {
    return this._state.stateName;
  }

  subscribe(listener: StateEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  transitionTo(state: IState): void {
    this._state = state;
    this._state.setContext(this);
  }

  async emit(event: GroupStateEvent): Promise<void> {
    const promises = Array.from(this.listeners).map(async (listener) => {
      try {
        await listener(event);
      } catch (error) {
        console.error("[GroupContext] Error in event listener:", error);
      }
    });
    await Promise.all(promises);
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

  transitionToDissolved(): void {
    this._state = new Dissolved();
    this._state.setContext(this);
  }

  transitionToBlocked(): void {
    this._state = new Blocked();
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
