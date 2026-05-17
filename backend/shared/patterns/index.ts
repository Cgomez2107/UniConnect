/**
 * Exports del módulo patterns
 * 
 * Patrones implementados:
 * - Factory Method: Para crear publicaciones
 * - Singleton: Logger y DatabaseHandler (en libs)
 * - Decorator: Middleware apilable para autenticación
 * - Facade: Simplificar procesos complejos (registro, crear grupo)
 * - Strategy: Algoritmos intercambiables de búsqueda/recomendación
 * - Observer: Notificaciones por eventos
 */

export * from './factory/index.js';
export * from './decorator/index.js';
export * from './facade/index.js';
export * from './observer/index.js';
export * from './strategy/index.js';
