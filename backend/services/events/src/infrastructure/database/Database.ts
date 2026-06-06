import pg from "pg";
const { Pool } = pg;
import type { EventsEnv } from "../../config/env.js";

/**
 * Singleton Database
 * Centraliza la conexión al pool de PostgreSQL para el servicio de events.
 */
export class Database {
  private static instance: Database | null = null;
  private static activeEnv: EventsEnv | null = null;
  private readonly pool: pg.Pool;

  private constructor(env: EventsEnv) {
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
          service: "events",
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
   * Lanza un error si se intenta obtener la instancia sin inicializarla previamente y sin proveer env.
   * Lanza un error si se llama con un env distinto al que ya está activo (inmutabilidad de configuración).
   */
  public static getInstance(env?: EventsEnv): Database {
    if (!Database.instance) {
      if (!env) {
        throw new Error(
          "[Database:events] No ha sido inicializada y no se proporcionó la configuración (env).",
        );
      }
      Database.activeEnv = env;
      Database.instance = new Database(env);
    } else if (env && env !== Database.activeEnv) {
      console.warn(
        JSON.stringify({
          service: "events",
          level: "warn",
          message:
            "[Database] getInstance() fue llamado con un env distinto al activo. La configuración es inmutable; se ignora el nuevo env.",
        }),
      );
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
   * Cierra el pool de conexiones y destruye la instancia Singleton.
   * Fundamental para un graceful shutdown y evitar fugas de memoria.
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log(`[Database:events] Pool de conexiones cerrado exitosamente.`);
    } catch (error) {
      console.error(`[Database:events] Error al cerrar el pool de conexiones:`, error);
    } finally {
      Database.instance = null; // Previene "conexiones huérfanas" y permite reinicialización
      Database.activeEnv = null;
    }
  }
}
