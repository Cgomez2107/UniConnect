import pg from "pg";
const { Pool } = pg;
import type { ProfilesCatalogEnv } from "../../config/env.js";

/**
 * Singleton Database para el servicio de Profiles Catalog.
 */
export class Database {
  private static instance: Database | null = null;
  private readonly pool: pg.Pool;

  private constructor(env: ProfilesCatalogEnv) {
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
          service: "profiles-catalog",
          level: "error",
          message: "Unexpected error on idle database client",
          error: err.message,
        }),
      );
    });
  }

  public static getInstance(env: ProfilesCatalogEnv): Database {
    if (!Database.instance) {
      Database.instance = new Database(env);
    }
    return Database.instance;
  }

  public getPool(): pg.Pool {
    return this.pool;
  }
}
