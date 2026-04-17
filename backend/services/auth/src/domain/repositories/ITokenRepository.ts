import { RefreshToken } from "../entities/RefreshToken.js";

export interface ITokenRepository {
  create(token: Omit<RefreshToken, "id" | "createdAt">): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revoke(token: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
