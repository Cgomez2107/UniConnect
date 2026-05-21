import type { DomainError } from "@uniconnect/shared-types";
export interface RetryConfig {
    maxRetries: number;
    delays: number[];
    retryableErrorPatterns: RegExp[];
}
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
export declare class BaseClient {
    protected config: RetryConfig;
    constructor(config?: RetryConfig);
    protected ensureArray<T>(data: T | T[] | undefined | null): T[];
    request<T>(fn: () => Promise<T>): Promise<T>;
    protected isRetryable(error: unknown): boolean;
    protected isDnsError(error: unknown): boolean;
    protected isNetworkError(error: unknown): boolean;
    isRetryableHttp(status: number | undefined): boolean;
    protected getHttpStatus(error: unknown): number | undefined;
    mapError(error: unknown): DomainError;
    private delay;
}
//# sourceMappingURL=BaseClient.d.ts.map