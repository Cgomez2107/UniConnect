/**
 * Shared State Types
 */
/**
 * Console logger implementation (default)
 */
export class ConsoleLogger {
    debug(message, ...args) {
        console.debug(`[DEBUG] ${message}`, ...args);
    }
    info(message, ...args) {
        console.info(`[INFO] ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    }
}
/**
 * No-op logger for testing/CI
 */
export class NoopLogger {
    debug() { }
    info() { }
    warn() { }
    error() { }
}
//# sourceMappingURL=index.js.map