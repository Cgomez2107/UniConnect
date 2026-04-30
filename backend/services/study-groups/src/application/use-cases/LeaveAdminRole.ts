import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface LeaveAdminRoleInput {
  readonly requestId: string;
  readonly actorUserId: string;
}

export class LeaveAdminRole {
  constructor(private readonly repository: IAdminTransferRepository) {}

  async execute(input: LeaveAdminRoleInput): Promise<void> {
    const requestId = requireTrimmed(input.requestId, "requestId");

    await this.repository.leaveAdminRole({
      requestId,
      actorUserId: input.actorUserId,
    });
  }
}
