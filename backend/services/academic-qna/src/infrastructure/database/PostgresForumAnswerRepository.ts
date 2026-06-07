import type { Pool } from "pg";
import type { ForumAnswer } from "../../domain/entities/ForumAnswer.js";
import type { IForumAnswerRepository } from "../../domain/repositories/IForumAnswerRepository.js";

interface AnswerRow {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  body: string;
  vote_count: number;
  is_solution: boolean;
  is_pinned: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

function mapAnswer(row: AnswerRow): ForumAnswer {
  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    voteCount: Number(row.vote_count),
    isSolution: row.is_solution,
    isPinned: row.is_pinned,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PostgresForumAnswerRepository implements IForumAnswerRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: Omit<ForumAnswer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForumAnswer> {
    const result = await this.pool.query<AnswerRow>(
      `
        WITH inserted AS (
          INSERT INTO forum_answers (question_id, author_id, body, vote_count)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        )
        SELECT i.*, COALESCE(p.full_name, i.author_id::text) AS author_name
        FROM inserted i
        LEFT JOIN profiles p ON p.id = i.author_id
      `,
      [data.questionId, data.authorId, data.body, data.voteCount],
    );

    return mapAnswer(result.rows[0]);
  }

  async findById(id: string): Promise<ForumAnswer | null> {
    const result = await this.pool.query<AnswerRow>(
      `SELECT fa.*, COALESCE(p.full_name, fa.author_id::text) AS author_name
       FROM forum_answers fa
       LEFT JOIN profiles p ON p.id = fa.author_id
       WHERE fa.id = $1`,
      [id],
    );

    return result.rows[0] ? mapAnswer(result.rows[0]) : null;
  }

  async findByQuestion(questionId: string): Promise<ForumAnswer[]> {
    const result = await this.pool.query<AnswerRow>(
      `
        SELECT fa.*, COALESCE(p.full_name, fa.author_id::text) AS author_name
        FROM forum_answers fa
        LEFT JOIN profiles p ON p.id = fa.author_id
        WHERE fa.question_id = $1
    ORDER BY fa.is_pinned DESC, fa.is_solution DESC, fa.vote_count DESC, fa.created_at ASC
      `,
      [questionId],
    );

    return result.rows.map(mapAnswer);
  }

  async pinAnswer(answerId: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE forum_answers
        SET is_pinned = true, updated_at = NOW()
        WHERE id = $1
      `,
      [answerId],
    );
  }

  async markAsSolution(answerId: string): Promise<void> {
    await this.pool.query(
      `UPDATE forum_answers SET is_solution = true, updated_at = NOW() WHERE id = $1`,
      [answerId],
    );
  }

  async unmarkAllSolutionsForQuestion(questionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE forum_answers SET is_solution = false, updated_at = NOW() WHERE question_id = $1`,
      [questionId],
    );
  }
}
