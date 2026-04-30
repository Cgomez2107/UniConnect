import type { Member } from "../../domain/entities/Member.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";

export class InMemoryMemberRepository implements IMemberRepository {
  async listByRequest(_input: { requestId: string; actorUserId: string }): Promise<Member[]> {
    return [];
  }
}
