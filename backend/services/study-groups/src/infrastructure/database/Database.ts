import pg from "pg";
const { Pool } = pg;
import type { StudyGroupsEnv } from "../../config/env.js";

/**
 * Singleton Database
 * Centraliza la conexión al pool de PostgreSQL para el servicio de study-groups.
 */
export class Database {
  private static instance: Database | null = null;
  private readonly pool: pg.Pool;

  private constructor(env: StudyGroupsEnv) {
    this.pool = new Pool({
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
      max: 20, // Requerimiento: Pool de alto rendimiento
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on("error", (err) => {
      console.error(
        JSON.stringify({
          service: "study-groups",
          level: "error",
          message: "Unexpected error on idle database client",
          error: err.message,
        }),
      );
    });
  }

  /**
   * Retorna la instancia única de Database.
   * Si no existe, se crea utilizando el env proporcionado.
   * Si ya existe, ignora el argumento env.
   */
  public static getInstance(env: StudyGroupsEnv): Database {
    if (!Database.instance) {
      Database.instance = new Database(env);
    }
    return Database.instance;
  }

  /**
   * Expone el Pool de conexiones para ser inyectado en los repositorios.
   */
  public getPool(): pg.Pool {
    return this.pool;
  }

  /**
   * Cierra el pool de conexiones (útil para tests o shutdown limpio).
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}
