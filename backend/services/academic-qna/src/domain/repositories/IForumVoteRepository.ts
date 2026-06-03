import type { ForumVote } from '../entities/ForumVote.js';
import type { VoteTargetType, VoteType } from '../entities/types.js';

export interface IForumVoteRepository {
  findVote(targetType: VoteTargetType, targetId: string, voterId: string): Promise<ForumVote | null>;
  upsertAndGetDelta(targetType: VoteTargetType, targetId: string, voterId: string, voteType: VoteType): Promise<number>;
  getUserVotes(userId: string, targets: Array<{ targetType: VoteTargetType; targetId: string }>): Promise<Map<string, VoteType>>;
}
