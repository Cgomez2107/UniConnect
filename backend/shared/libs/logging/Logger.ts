/**
 * Logger Singleton
 * 
 * Patrón Singleton: Una única instancia del logger compartida por todos los módulos.
 * Registra logs centralizados con timestamp, nivel y contexto.
 * 
 * Uso:
 *   const logger = Logger.getInstance();
 *   logger.info("Mensaje", { contexto: "value" });
 *   logger.error("Error", error);
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: any;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Mantener últimos 1000 logs en memoria

  private constructor(logLevel: string = 'INFO') {
    this.logLevel = (LogLevel[logLevel as keyof typeof LogLevel] || LogLevel.INFO) as LogLevel;
  }

  /**
   * Obtener instancia única del Logger (Singleton)
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(process.env.LOG_LEVEL || 'INFO');
    }
    return Logger.instance;
  }

  /**
   * Log DEBUG
   */
  public debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log INFO
   */
  public info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log WARN
   */
  public warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log ERROR
   */
  public error(message: string, context?: string, error?: any): void {
    this.log(LogLevel.ERROR, message, context, { error: error?.message || error });
  }

  /**
   * Log interno
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    // Comparar nivel de severidad
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || 'GLOBAL',
      data,
    };

    // Guardar en memoria
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Imprimir en consola
    this.printLog(entry);
  }

  /**
   * Determinar si se debe registrar el log según el nivel
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Imprimir log formateado en consola
   */
  private printLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.context}]`;
    const message = entry.message;
    const data = entry.data ? JSON.stringify(entry.data, null, 2) : '';

    const color = this.getColorForLevel(entry.level);
    const reset = '\x1b[0m';

    if (entry.level === LogLevel.ERROR) {
      console.error(`${color}${prefix}${reset} ${message}`, data || '');
    } else {
      console.log(`${color}${prefix}${reset} ${message}`, data || '');
    }
  }

  /**
   * Get ANSI color para cada nivel
   */
  private getColorForLevel(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    return colors[level];
  }

  /**
   * Get todos los logs (para debugging)
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Set log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export default Logger.getInstance();
