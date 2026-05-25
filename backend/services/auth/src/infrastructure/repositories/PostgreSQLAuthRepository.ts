import { Pool } from "pg";
import { User } from "../../domain/entities/User.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";

export class PostgreSQLAuthRepository implements IAuthRepository {
  private pool: Pool;

  constructor(connectionString?: string) {
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      "SELECT * FROM public.auth_users WHERE email = $1",
      [email]
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      "SELECT * FROM public.auth_users WHERE id = $1",
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<User> {
    const id = user.id ?? crypto.randomUUID();
    const createdAt = new Date();
    const updatedAt = new Date();

    const result = await this.pool.query(
      `INSERT INTO public.auth_users (id, email, full_name, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         full_name = EXCLUDED.full_name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [id, user.email, user.fullName, user.passwordHash, user.role, user.isActive, createdAt, updatedAt]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updatedAt = new Date();
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      email: "email",
      fullName: "full_name",
      passwordHash: "password_hash",
      role: "role",
      isActive: "is_active",
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMappings[key];
      if (dbField && value !== undefined) {
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error("User not found");
      return existing;
    }

    fields.push(`updated_at = $${paramIndex}`);
    values.push(updatedAt);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE public.auth_users SET ${fields.join(", ")} WHERE id = $${paramIndex + 1} RETURNING *`,
      values
    );

    const row = result.rows[0];
    if (!row) throw new Error("User not found");
    return this.mapRowToUser(row);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      passwordHash: row.password_hash,
      role: row.role as "estudiante" | "moderador" | "admin",
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
