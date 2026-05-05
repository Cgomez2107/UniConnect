import pg from "pg";
const { Pool } = pg;
import type { EventsEnv } from "../../config/env.js";

/**
 * Singleton Database para el servicio de Events.
 */
export class Database {
  private static instance: Database | null = null;
  private readonly pool: pg.Pool;

  private constructor(env: EventsEnv) {
    this.pool = new Pool({
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
      max: 20,
    });

    this.pool.on("error", (err) => {
      console.error(
        JSON.stringify({
          service: "events",
          level: "error",
          message: "Unexpected error on idle database client",
          error: err.message,
        }),
      );
    });
  }

  public static getInstance(env: EventsEnv): Database {
    if (!Database.instance) {
      Database.instance = new Database(env);
    }
    return Database.instance;
  }

  public getPool(): pg.Pool {
    return this.pool;
  }
}
