/**
 * DatabaseHandler Singleton
 * 
 * Patrón Singleton: Una única instancia de conexión al pool de BD, compartida por todos los módulos.
 * Evita múltiples conexiones y mejora rendimiento.
 * 
 * Uso en cada servicio:
 *   const db = DatabaseHandler.getInstance();
 *   const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 */

import { Pool, QueryResult, PoolClient } from 'pg';
import Logger from '../logging/Logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number; // máximo de conexiones en el pool
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

export class DatabaseHandler {
  private static instance: DatabaseHandler;
  private pool: Pool | null = null;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private logger = Logger;

  private constructor() {}

  /**
   * Obtener instancia única del DatabaseHandler (Singleton)
   */
  public static getInstance(): DatabaseHandler {
    if (!DatabaseHandler.instance) {
      DatabaseHandler.instance = new DatabaseHandler();
    }
    return DatabaseHandler.instance;
  }

  /**
   * Inicializar conexión al pool de BD
   */
  public async initialize(config: DatabaseConfig): Promise<void> {
    if (this.isConnected) {
      this.logger.warn('DatabaseHandler ya está inicializado', 'DatabaseHandler');
      return;
    }

    try {
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: config.max || 20,
        connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      });

      // Test conexión
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      this.retryCount = 0;
      this.logger.info('✅ Conexión a PostgreSQL establecida', 'DatabaseHandler', {
        host: config.host,
        database: config.database,
        poolSize: config.max,
      });
    } catch (error) {
      this.logger.error('❌ Error conectando a PostgreSQL', 'DatabaseHandler', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.logger.warn(`Reintentando (${this.retryCount}/${this.maxRetries})...`, 'DatabaseHandler');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.initialize(config);
      }

      throw new Error('No se pudo conectar a PostgreSQL después de múltiples intentos');
    }

    // Manejar eventos de error del pool
    if (this.pool) {
      this.pool.on('error', (err) => {
        this.logger.error('Error inesperado en el pool de conexiones', 'DatabaseHandler', err);
      });
    }
  }

  /**
   * Ejecutar query simple
   */
  public async query(text: string, values?: any[]): Promise<QueryResult> {
    if (!this.pool || !this.isConnected) {
      throw new Error('DatabaseHandler no está inicializado');
    }

    try {
      return await this.pool.query(text, values);
    } catch (error) {
      this.logger.error('Error ejecutando query', 'DatabaseHandler', {
        query: text,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Ejecutar transacción
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.pool || !this.isConnected) {
      throw new Error('DatabaseHandler no está inicializado');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error en transacción', 'DatabaseHandler', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener cliente del pool (para consultas avanzadas)
   */
  public async getClient(): Promise<PoolClient> {
    if (!this.pool || !this.isConnected) {
      throw new Error('DatabaseHandler no está inicializado');
    }
    return this.pool.connect();
  }

  /**
   * Cerrar conexión al pool
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      this.logger.info('Conexión al pool de BD cerrada', 'DatabaseHandler');
    }
  }

  /**
   * Verificar si está conectado
   */
  public isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Get estado del pool
   */
  public getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

export default DatabaseHandler.getInstance();
