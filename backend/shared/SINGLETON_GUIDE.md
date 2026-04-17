/**
 * Guía de Implementación del Patrón Singleton
 * 
 * ===============================================
 * PATRÓN SINGLETON EN UNICONNECT
 * ===============================================
 * 
 * El Singleton es un patrón creacional que asegura que una clase tenga
 * una única instancia y proporciona un punto de acceso global a ella.
 * 
 * En UniConnect, implementamos dos Singletons centrales:
 * 
 * 1. LOGGER SINGLETON
 * -------------------
 * Ubicación: /backend/shared/libs/logging/Logger.ts
 * 
 * Beneficios:
 * - Logging centralizado desde todos los microservicios
 * - Rastreo completo de eventos en todo el sistema
 * - Control de niveles de log (DEBUG, INFO, WARN, ERROR)
 * 
 * Uso en cualquier módulo:
 * ```typescript
 * import { Logger } from '@uniconnect/shared/libs';
 * 
 * class MyService {
 *   private logger = Logger.getInstance();
 * 
 *   async doSomething() {
 *     this.logger.info('Iniciando proceso', 'MyService', { userId: 123 });
 *     try {
 *       // ... lógica
 *       this.logger.info('Proceso completado', 'MyService');
 *     } catch (error) {
 *       this.logger.error('Error en proceso', 'MyService', error);
 *       throw error;
 *     }
 *   }
 * }
 * ```
 * 
 * 2. DATABASE HANDLER SINGLETON
 * -----------------------------
 * Ubicación: /backend/shared/libs/database/DatabaseHandler.ts
 * 
 * Beneficios:
 * - Una única conexión al pool de PostgreSQL
 * - Compartida por autenticación, perfiles, chat, grupos
 * - Evita cuellos de botella
 * - Reintentos automáticos y manejo de errores centralizado
 * 
 * Inicialización en main.ts de cada servicio:
 * ```typescript
 * import { DatabaseHandler, Logger } from '@uniconnect/shared/libs';
 * 
 * const logger = Logger.getInstance();
 * const db = DatabaseHandler.getInstance();
 * 
 * async function main() {
 *   try {
 *     // Inicializar BD una sola vez
 *     await db.initialize({
 *       host: process.env.DB_HOST!,
 *       port: parseInt(process.env.DB_PORT || '5432'),
 *       database: process.env.DB_NAME!,
 *       user: process.env.DB_USER!,
 *       password: process.env.DB_PASSWORD!,
 *       ssl: process.env.DB_SSL === 'true',
 *       max: 20, // máximo de conexiones en el pool
 *     });
 * 
 *     logger.info('Base de datos inicializada', 'Main');
 *     
 *     // Resto del código del servidor...
 *     
 *   } catch (error) {
 *     logger.error('Error fatal', 'Main', error);
 *     process.exit(1);
 *   }
 * }
 * 
 * main();
 * ```
 * 
 * Uso en repositorios (Infrastructure Layer):
 * ```typescript
 * import { DatabaseHandler } from '@uniconnect/shared/libs';
 * 
 * export class PostgresStudyRequestRepository implements IStudyRequestRepository {
 *   private db = DatabaseHandler.getInstance();
 * 
 *   async create(request: StudyRequest): Promise<void> {
 *     const query = `
 *       INSERT INTO study_requests (id, author_id, subject_id, title, description)
 *       VALUES ($1, $2, $3, $4, $5)
 *     `;
 *     await this.db.query(query, [
 *       request.id,
 *       request.authorId,
 *       request.subjectId,
 *       request.title,
 *       request.description,
 *     ]);
 *   }
 * 
 *   async findById(id: string): Promise<StudyRequest | null> {
 *     const result = await this.db.query(
 *       'SELECT * FROM study_requests WHERE id = $1',
 *       [id]
 *     );
 *     return result.rows[0] || null;
 *   }
 * }
 * ```
 * 
 * Uso en transacciones:
 * ```typescript
 * async function transferPoints(fromUserId: string, toUserId: string, amount: number) {
 *   const db = DatabaseHandler.getInstance();
 * 
 *   return await db.transaction(async (client) => {
 *     // Restar puntos del usuario origen
 *     await client.query(
 *       'UPDATE users SET points = points - $1 WHERE id = $2',
 *       [amount, fromUserId]
 *     );
 * 
 *     // Sumar puntos al usuario destino
 *     await client.query(
 *       'UPDATE users SET points = points + $1 WHERE id = $2',
 *       [amount, toUserId]
 *     );
 * 
 *     return true;
 *   });
 * }
 * ```
 * 
 * ===============================================
 * CÓMO FUNCIONA EL SINGLETON
 * ===============================================
 * 
 * 1. Primera llamada:
 *    const db = DatabaseHandler.getInstance();
 *    ↓ Crea nueva instancia (constructor privado)
 *    ↓ Almacena en variable estática
 * 
 * 2. Siguientes llamadas:
 *    const db = DatabaseHandler.getInstance();
 *    ↓ Retorna instancia existente (sin crear una nueva)
 * 
 * 3. Resultado:
 *    - TODAS las llamadas usan LA MISMA conexión
 *    - Mejora rendimiento (evita múltiples conexiones)
 *    - Logging centralizado y consistente
 * 
 * ===============================================
 * CHECKLIST DE IMPLEMENTACIÓN
 * ===============================================
 * 
 * En cada microservicio (auth, study-groups, resources, messaging, etc):
 * 
 * [ ] main.ts:
 *     - Importar DatabaseHandler y Logger
 *     - Llamar db.initialize() al iniciar
 * 
 * [ ] Repositories (Infrastructure):
 *     - Importar DatabaseHandler
 *     - Usar this.db = DatabaseHandler.getInstance()
 *     - Reemplazar conexiones locales por query()
 * 
 * [ ] Use Cases (Application):
 *     - Importar Logger
 *     - Loguear inicio/fin de operaciones
 *     - Loguear errores con contexto
 * 
 * [ ] Controllers (Interfaces):
 *     - Loguear requests/responses
 * 
 * ===============================================
 * VENTAJAS DE ESTE ENFOQUE
 * ===============================================
 * 
 * ✅ Una sola conexión compartida = mejor rendimiento
 * ✅ Logger centralizado = debugging más fácil
 * ✅ Reintentos automáticos en BD
 * ✅ Transacciones atómicas
 * ✅ Monitoreo del estado del pool
 * ✅ Manejo consistente de errores
 * ✅ Fácil de testear (mockear el Singleton)
 * ✅ Escalable a múltiples servidores
 * 
 */

export const SINGLETON_IMPLEMENTATION_GUIDE = true;
