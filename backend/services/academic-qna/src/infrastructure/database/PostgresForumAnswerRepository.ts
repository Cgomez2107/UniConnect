import type { Pool } from "pg";
import type { ForumAnswer } from "../../domain/entities/ForumAnswer.js";
import type { IForumAnswerRepository } from "../../domain/repositories/IForumAnswerRepository.js";

interface AnswerRow {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  vote_count: number;
  created_at: string | Date;
  updated_at: string | Date;
}

function mapAnswer(row: AnswerRow): ForumAnswer {
  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    body: row.body,
    voteCount: Number(row.vote_count),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PostgresForumAnswerRepository implements IForumAnswerRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: Omit<ForumAnswer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForumAnswer> {
    const result = await this.pool.query<AnswerRow>(
      `
        INSERT INTO forum_answers (question_id, author_id, body, vote_count)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [data.questionId, data.authorId, data.body, data.voteCount],
    );

    return mapAnswer(result.rows[0]);
  }

  async findById(id: string): Promise<ForumAnswer | null> {
    const result = await this.pool.query<AnswerRow>(
      `SELECT * FROM forum_answers WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? mapAnswer(result.rows[0]) : null;
  }

  async findByQuestion(questionId: string): Promise<ForumAnswer[]> {
    const result = await this.pool.query<AnswerRow>(
      `
        SELECT * FROM forum_answers
        WHERE question_id = $1
        ORDER BY vote_count DESC, created_at ASC
      `,
      [questionId],
    );

    return result.rows.map(mapAnswer);
  }
}
