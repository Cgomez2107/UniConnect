import type { Pool } from "pg";
import type { ForumVote } from "../../domain/entities/ForumVote.js";
import type { IForumVoteRepository } from "../../domain/repositories/IForumVoteRepository.js";
import type { VoteTargetType, VoteType } from "../../domain/entities/types.js";

interface VoteRow {
  id: string;
  target_type: string;
  target_id: string;
  voter_id: string;
  vote_type: string;
  created_at: string | Date;
}

function mapVote(row: VoteRow): ForumVote {
  return {
    id: row.id,
    targetType: row.target_type as VoteTargetType,
    targetId: row.target_id,
    voterId: row.voter_id,
    voteType: row.vote_type as VoteType,
    createdAt: new Date(row.created_at),
  };
}

export class PostgresForumVoteRepository implements IForumVoteRepository {
  constructor(private readonly pool: Pool) {}

  async findVote(targetType: VoteTargetType, targetId: string, voterId: string): Promise<ForumVote | null> {
    const result = await this.pool.query<VoteRow>(
      `
        SELECT * FROM forum_votes
        WHERE target_type = $1 AND target_id = $2 AND voter_id = $3
        LIMIT 1
      `,
      [targetType, targetId, voterId],
    );

    return result.rows[0] ? mapVote(result.rows[0]) : null;
  }

  async upsertAndGetDelta(targetType: VoteTargetType, targetId: string, voterId: string, voteType: VoteType): Promise<number> {
    const result = await this.pool.query<{ rpc_vote: string }>(
      `SELECT public.rpc_vote($1, $2, $3, $4) AS rpc_vote`,
      [targetType, targetId, voterId, voteType],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Error al ejecutar rpc_vote.');
    }

    const parsed = JSON.parse(row.rpc_vote) as { success: boolean; vote_count: number };
    return parsed.vote_count;
  }
}
