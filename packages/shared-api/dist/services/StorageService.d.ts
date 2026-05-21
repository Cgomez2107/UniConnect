export type StorageErrorCode = "SERVICE_UNAVAILABLE" | "NETWORK_ERROR" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR" | "UNKNOWN_ERROR";
export interface StorageError {
    code: StorageErrorCode;
    message: string;
    severity: "warning" | "error";
    details: Record<string, unknown>;
    timestamp: Date;
}
export interface StorageBucketConfig {
    name: string;
    public: boolean;
    allowedMimeTypes: string[];
    maxFileSizeMb: number;
}
export interface StorageUploadResult {
    url: string;
    path: string;
    bucket: string;
}
export declare const STORAGE_BUCKETS: Record<string, StorageBucketConfig>;
export declare function mapStorageError(error: unknown): StorageError;
export declare class StorageService {
    private supabase;
    private readonly maxRetries;
    constructor(supabaseUrl: string, supabaseAnonKey: string);
    private requestWithRetry;
    uploadAvatar(userId: string, file: File): Promise<StorageUploadResult>;
    uploadResource(userId: string, file: File): Promise<StorageUploadResult>;
    uploadChatImage(conversationId: string, file: File): Promise<StorageUploadResult>;
    deleteFile(bucket: string, path: string): Promise<void>;
}
//# sourceMappingURL=StorageService.d.ts.map