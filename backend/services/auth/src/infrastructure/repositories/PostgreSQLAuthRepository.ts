import { User } from "../../domain/entities/User.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import type { Pool } from "pg";

export class PostgreSQLAuthRepository implements IAuthRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, full_name, password_hash, role, created_at, updated_at, is_active
       FROM users WHERE email = $1`,
      [email],
    );
    if (result.rows.length === 0) return null;
    return this.toUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, full_name, password_hash, role, created_at, updated_at, is_active
       FROM users WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return this.toUser(result.rows[0]);
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (email, full_name, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, password_hash, role, created_at, updated_at, is_active`,
      [user.email, user.fullName, user.passwordHash, user.role, user.isActive],
    );
    return this.toUser(result.rows[0]);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.fullName !== undefined) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(data.fullName);
    }
    if (data.passwordHash !== undefined) {
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(data.passwordHash);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex}
       RETURNING id, email, full_name, password_hash, role, created_at, updated_at, is_active`,
      values,
    );
    if (result.rows.length === 0) throw new Error("User not found");
    return this.toUser(result.rows[0]);
  }

  private toUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      fullName: row.full_name as string,
      passwordHash: row.password_hash as string,
      role: row.role as "estudiante" | "moderador" | "admin",
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      isActive: row.is_active as boolean,
    };
  }
}
