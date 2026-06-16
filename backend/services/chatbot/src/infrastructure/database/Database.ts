import pg from "pg";
const { Pool } = pg;
import type { ChatbotEnv } from "../../config/env.js";

export class Database {
  private static instance: Database | null = null;
  private static activeEnv: ChatbotEnv | null = null;
  private readonly pool: pg.Pool;

  private constructor(env: ChatbotEnv) {
    this.pool = new Pool({
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on("error", (err) => {
      console.error(
        JSON.stringify({
          service: "chatbot",
          level: "error",
          message: "Unexpected error on idle database client",
          error: err.message,
        }),
      );
    });
  }

  public static getInstance(env?: ChatbotEnv): Database {
    if (!Database.instance) {
      if (!env) {
        throw new Error(
          "[Database:chatbot] No ha sido inicializada y no se proporcionó la configuración (env).",
        );
      }
      Database.activeEnv = env;
      Database.instance = new Database(env);
    }
    return Database.instance;
  }

  public getPool(): pg.Pool {
    return this.pool;
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log(`[Database:chatbot] Pool de conexiones cerrado exitosamente.`);
    } catch (error) {
      console.error(`[Database:chatbot] Error al cerrar el pool de conexiones:`, error);
    } finally {
      Database.instance = null;
      Database.activeEnv = null;
    }
  }
}
