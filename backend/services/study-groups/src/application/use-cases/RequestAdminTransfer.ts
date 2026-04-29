import type { AdminTransfer } from "../../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import type { TransferenciaAdminSolicitadaEvent } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface RequestAdminTransferInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly targetUserId: string;
}

export class RequestAdminTransfer {
  constructor(
    private readonly repository: IAdminTransferRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: RequestAdminTransferInput): Promise<AdminTransfer> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const targetUserId = requireTrimmed(input.targetUserId, "targetUserId");

    const created = await this.repository.requestTransfer({
      requestId,
      actorUserId: input.actorUserId,
      targetUserId,
    });

    const event: TransferenciaAdminSolicitadaEvent = {
      type: "TRANSFERENCIA_ADMIN_SOLICITADA",
      version: "1.0",
      timestamp: new Date(),
      transferId: created.id,
      requestId: created.requestId,
      actorUserId: input.actorUserId,
      targetUserId: created.toUserId,
    };

    this.subject.emit(event).catch((error) => {
      console.error("[RequestAdminTransfer] Error emitiendo evento:", error);
    });

    return created;
  }
}
