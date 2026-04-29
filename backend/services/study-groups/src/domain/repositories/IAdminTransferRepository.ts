import type { AdminTransfer } from "../entities/AdminTransfer.js";

export interface IAdminTransferRepository {
  getById(transferId: string): Promise<AdminTransfer | null>;
  requestTransfer(input: {
    requestId: string;
    actorUserId: string;
    targetUserId: string;
  }): Promise<AdminTransfer>;
  acceptTransfer(input: { transferId: string; actorUserId: string }): Promise<void>;
  leaveAdminRole(input: { requestId: string; actorUserId: string }): Promise<void>;
}
