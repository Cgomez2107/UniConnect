import type { Member } from "../entities/Member.js";

export interface IMemberRepository {
  listByRequest(input: { requestId: string; actorUserId: string }): Promise<Member[]>;
  findByGroup(groupId: string): Promise<Member[]>;
}
