import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";
import type { IAdminTransferRepository } from "../../repositories/IAdminTransferRepository.js";

export class PersistenceObserver implements IObserver {
  readonly name = "PersistenceObserver";

  constructor(private readonly repository: IAdminTransferRepository) {}

  async handle(event: StudyGroupEvent): Promise<void> {
    if (event.type === "ADMIN_TRANSFER_ACCEPTED") {
      await this.repository.acceptTransferAtomically(event.transferId, event.acceptedBy);
    }

    if (event.type === "ADMIN_ROLE_LEFT") {
      await this.repository.leaveAdminRole({
        requestId: event.requestId,
        actorUserId: event.userId,
      });
    }
  }
}
