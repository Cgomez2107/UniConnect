import type { Member } from "../domain/entities/Member.js";
import type { IMemberRepository } from "../domain/repositories/IMemberRepository.js";

export interface ListMembersByRequestInput {
  readonly requestId: string;
  readonly actorUserId: string;
}

export class ListMembersByRequest {
  constructor(private readonly repository: IMemberRepository) {}

  async execute(input: ListMembersByRequestInput): Promise<Member[]> {
    return this.repository.listByRequest({
      requestId: input.requestId,
      actorUserId: input.actorUserId,
    });
  }
}
