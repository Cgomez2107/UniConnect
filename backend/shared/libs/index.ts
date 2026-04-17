/**
 * Exports centralizados de shared/libs
 * 
 * Singleton Pattern:
 * - Logger: Log centralizado para todos los módulos
 * - DatabaseHandler: Conexión única al pool de BD compartida por todos los servicios
 */

export * from './logging';
export * from './database';
export * from './config';
export * from './errors';
export * from './validation';
