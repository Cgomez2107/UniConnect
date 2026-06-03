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

  async getUserVotes(userId: string, targets: Array<{ targetType: VoteTargetType; targetId: string }>): Promise<Map<string, VoteType>> {
    if (targets.length === 0) return new Map();

    const values: unknown[] = [userId];
    const conditions = targets
      .map((t, i) => {
        const idx = i * 2 + 2;
        values.push(t.targetType, t.targetId);
        return `(target_type = $${idx}::VARCHAR(10) AND target_id = $${idx + 1})`;
      })
      .join(" OR ");

    const result = await this.pool.query<VoteRow>(
      `SELECT target_id, vote_type FROM forum_votes WHERE voter_id = $1 AND (${conditions})`,
      values,
    );

    const map = new Map<string, VoteType>();
    for (const row of result.rows) {
      map.set(row.target_id, row.vote_type as VoteType);
    }
    return map;
  }

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
    const upsertResult = await this.pool.query<{ action: string }>(
      `
      WITH deleted AS (
        DELETE FROM forum_votes
        WHERE target_type = $1::VARCHAR(10) AND target_id = $2 AND voter_id = $3 AND vote_type = $4::VARCHAR(10)
        RETURNING vote_type
      ),
      upserted AS (
        INSERT INTO forum_votes (target_type, target_id, voter_id, vote_type)
        SELECT $1::VARCHAR(10), $2, $3, $4::VARCHAR(10)
        WHERE NOT EXISTS (SELECT 1 FROM deleted)
        ON CONFLICT (target_type, target_id, voter_id) DO UPDATE
        SET vote_type = EXCLUDED.vote_type, created_at = NOW()
        RETURNING CASE WHEN xmax = 0 THEN 'new' ELSE 'switch' END AS action
      )
      SELECT COALESCE(
        (SELECT 'deleted' FROM deleted LIMIT 1),
        (SELECT action FROM upserted LIMIT 1),
        'none'
      ) AS action
      `,
      [targetType, targetId, voterId, voteType],
    );

    const action = upsertResult.rows[0]?.action ?? 'none';

    let delta: number;
    switch (action) {
      case 'deleted':
        delta = voteType === 'upvote' ? -1 : 1;
        break;
      case 'new':
        delta = voteType === 'upvote' ? 1 : -1;
        break;
      case 'switch':
        delta = voteType === 'upvote' ? 2 : -2;
        break;
      default:
        delta = 0;
    }

    if (targetType === 'question') {
      const updateResult = await this.pool.query<{ vote_count: number }>(
        `UPDATE forum_questions SET vote_count = vote_count + $1 WHERE id = $2 RETURNING vote_count`,
        [delta, targetId],
      );
      return updateResult.rows[0]?.vote_count ?? 0;
    } else {
      const updateResult = await this.pool.query<{ vote_count: number }>(
        `UPDATE forum_answers SET vote_count = vote_count + $1 WHERE id = $2 RETURNING vote_count`,
        [delta, targetId],
      );
      return updateResult.rows[0]?.vote_count ?? 0;
    }
  }
}
