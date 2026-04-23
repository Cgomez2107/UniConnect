import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class GetUnreadCount {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(actorUserId: string): Promise<number> {
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");
    return this.repository.getUnreadCountForUser(normalizedActorUserId);
  }
}
