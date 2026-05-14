/**
 * Exports centralizados de shared/libs
 * 
 * Singleton Pattern:
 * - Logger: Log centralizado para todos los módulos
 * - DatabaseHandler: Conexión única al pool de BD compartida por todos los servicios
 */

export * from './logging/index.js';
export * from './database/index.js';
export * from './config/index.js';
export * from './errors/index.js';
export * from './validation/index.js';
