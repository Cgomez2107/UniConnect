import type { AdminTransfer } from "../../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";

export class InMemoryAdminTransferRepository implements IAdminTransferRepository {
  private readonly transfers: AdminTransfer[] = [];

  async requestTransfer(input: {
    requestId: string;
    actorUserId: string;
    targetUserId: string;
  }): Promise<AdminTransfer> {
    const created: AdminTransfer = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      fromUserId: input.actorUserId,
      toUserId: input.targetUserId,
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    this.transfers.push(created);
    return created;
  }

  async acceptTransfer(input: { transferId: string; actorUserId: string }): Promise<void> {
    const transfer = this.transfers.find((item) => item.id === input.transferId);
    if (!transfer) {
      throw new Error("Transfer request not found");
    }

    if (transfer.toUserId !== input.actorUserId) {
      throw new Error("No autorizado para aceptar la transferencia.");
    }

    transfer.status = "aceptada";
    transfer.respondedAt = new Date().toISOString();
  }

  async leaveAdminRole(_input: { requestId: string; actorUserId: string }): Promise<void> {
    return;
  }
}
