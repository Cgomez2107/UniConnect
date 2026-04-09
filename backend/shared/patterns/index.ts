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

export * from './factory';
export * from './decorator';
export * from './facade';
export * from './observer';
