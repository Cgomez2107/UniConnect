import type { VoteTargetType, VoteType } from './types.js';

export interface ForumVote {
  id: string;
  targetType: VoteTargetType;
  targetId: string;
  voterId: string;
  voteType: VoteType;
  createdAt: Date;
}
