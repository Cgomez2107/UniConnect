import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import type { TransferenciaAdminAceptadaEvent } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface AcceptAdminTransferInput {
  readonly transferId: string;
  readonly actorUserId: string;
}

export class AcceptAdminTransfer {
  constructor(
    private readonly repository: IAdminTransferRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: AcceptAdminTransferInput): Promise<void> {
    const transferId = requireTrimmed(input.transferId, "transferId");

    const transfer = await this.repository.getById(transferId);
    if (!transfer) {
      throw new Error("Transferencia no encontrada.");
    }

    await this.repository.acceptTransfer({
      transferId,
      actorUserId: input.actorUserId,
    });

    const event: TransferenciaAdminAceptadaEvent = {
      type: "TRANSFERENCIA_ADMIN_ACEPTADA",
      version: "1.0",
      timestamp: new Date(),
      transferId,
      requestId: transfer.requestId,
      fromUserId: transfer.fromUserId,
      toUserId: transfer.toUserId,
      actorUserId: input.actorUserId,
    };

    this.subject.emit(event).catch((error) => {
      console.error("[AcceptAdminTransfer] Error emitiendo evento:", error);
    });
  }
}
