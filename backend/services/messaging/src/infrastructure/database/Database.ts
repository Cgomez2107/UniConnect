import pg from "pg";
const { Pool } = pg;
import type { MessagingEnv } from "../../config/env.js";

/**
 * Singleton Database para el servicio de Messaging.
 */
export class Database {
  private static instance: Database | null = null;
  private readonly pool: pg.Pool;

  private constructor(env: MessagingEnv) {
    this.pool = new Pool({
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on("error", (err) => {
      console.error(
        JSON.stringify({
          service: "messaging",
          level: "error",
          message: "Unexpected error on idle database client",
          error: err.message,
        }),
      );
    });
  }

  public static getInstance(env: MessagingEnv): Database {
    if (!Database.instance) {
      Database.instance = new Database(env);
    }
    return Database.instance;
  }

  public getPool(): pg.Pool {
    return this.pool;
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
