import { User } from "../../domain/entities/User.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";

// TODO: Reemplazar con PostgreSQL cuando esté disponible
export class PostgreSQLAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    // TODO: SELECT * FROM users WHERE email = $1
    return Array.from(this.users.values()).find((u) => u.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    // TODO: SELECT * FROM users WHERE id = $1
    return this.users.get(id) || null;
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    // TODO: INSERT INTO users (...) VALUES (...)
    const id = crypto.randomUUID();
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // TODO: UPDATE users SET ... WHERE id = $1
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updated = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }
}
