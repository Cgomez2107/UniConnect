/**
 * Shared State Types
 */

import type { AuthClient, BaseMessagingClient, RealtimeChatDecorator } from "@uniconnect/shared-api";
import type { IStorageAdapter } from "../adapters/storage/IStorageAdapter.js";

/**
 * Dependency Injection Container
 * All stores receive these dependencies
 */
export interface StoreDeps {
  apiClients: {
    auth: AuthClient;
    messaging: BaseMessagingClient;
    messagingRealtime: RealtimeChatDecorator;
    studyGroups?: any;
    resources?: any;
    events?: any;
    forum?: any;
  };
  storage: IStorageAdapter;
  logger?: Logger;
  onSessionCreated?: (tokens: { accessToken: string; refreshToken: string }) => void;
}

/**
 * Optional logger interface
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Console logger implementation (default)
 */
export class ConsoleLogger implements Logger {
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * No-op logger for testing/CI
 */
export class NoopLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
