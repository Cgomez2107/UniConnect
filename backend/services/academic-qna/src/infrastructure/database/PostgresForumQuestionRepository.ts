import type { Pool } from "pg";
import type { ForumQuestion } from "../../domain/entities/ForumQuestion.js";
import type { QuestionSummary } from "../../domain/entities/QuestionSummary.js";
import type { IForumQuestionRepository } from "../../domain/repositories/IForumQuestionRepository.js";

interface QuestionRow {
  id: string;
  subject_id: string;
  author_id: string;
  title: string;
  body: string;
  status: string;
  answer_count: number;
  vote_count: number;
  created_at: string | Date;
  updated_at: string | Date;
}

interface SummaryRow {
  id: string;
  subject_id: string;
  author_id: string;
  title: string;
  status: string;
  answer_count: number;
  vote_count: number;
  created_at: string | Date;
  updated_at: string | Date;
}

function mapQuestion(row: QuestionRow): ForumQuestion {
  return {
    id: row.id,
    subjectId: row.subject_id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    status: row.status,
    answerCount: Number(row.answer_count),
    voteCount: Number(row.vote_count),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapSummary(row: SummaryRow): QuestionSummary {
  return {
    id: row.id,
    subjectId: row.subject_id,
    authorId: row.author_id,
    title: row.title,
    status: row.status,
    answerCount: Number(row.answer_count),
    voteCount: Number(row.vote_count),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PostgresForumQuestionRepository implements IForumQuestionRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: Omit<ForumQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForumQuestion> {
    const result = await this.pool.query<QuestionRow>(
      `
        INSERT INTO forum_questions (subject_id, author_id, title, body, status, answer_count, vote_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [data.subjectId, data.authorId, data.title, data.body, data.status, data.answerCount, data.voteCount],
    );

    return mapQuestion(result.rows[0]);
  }

  async findById(id: string): Promise<ForumQuestion | null> {
    const result = await this.pool.query<QuestionRow>(
      `SELECT * FROM forum_questions WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? mapQuestion(result.rows[0]) : null;
  }

  async findSummariesBySubject(subjectId: string, page: number, limit: number): Promise<QuestionSummary[]> {
    const offset = (page - 1) * limit;
    const result = await this.pool.query<SummaryRow>(
      `
        SELECT id, subject_id, author_id, title, status, answer_count, vote_count, created_at, updated_at
        FROM forum_questions
        WHERE subject_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [subjectId, limit, offset],
    );

    return result.rows.map(mapSummary);
  }

  async findBySubject(subjectId: string, page: number, limit: number): Promise<ForumQuestion[]> {
    const offset = (page - 1) * limit;
    const result = await this.pool.query<QuestionRow>(
      `
        SELECT * FROM forum_questions
        WHERE subject_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [subjectId, limit, offset],
    );

    return result.rows.map(mapQuestion);
  }

  async incrementAnswerCount(id: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE forum_questions SET answer_count = answer_count + 1 WHERE id = $1
      `,
      [id],
    );
  }

  async markAsSolved(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE forum_questions SET status = 'solved', updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async isAdminOfStudyGroup(questionId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT 1
        FROM forum_questions fq
        JOIN study_requests sr ON sr.id = fq.subject_id
        WHERE fq.id = $1
          AND (sr.author_id = $2 OR EXISTS (
            SELECT 1 FROM study_request_admins sra
            WHERE sra.request_id = sr.id AND sra.user_id = $2
          ))
        LIMIT 1
      `,
      [questionId, userId],
    );
    return result.rows.length > 0;
  }
}
