import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StorageErrorCode =
  | "SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "UNKNOWN_ERROR";

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

export const STORAGE_BUCKETS: Record<string, StorageBucketConfig> = {
  AVATARS: {
    name: "avatars",
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxFileSizeMb: 5,
  },
  RESOURCES: {
    name: "resources",
    public: true,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maxFileSizeMb: 50,
  },
  CHAT_MEDIA: {
    name: "resources",
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxFileSizeMb: 10,
  },
} as const;

const RETRY_DELAYS = [1000, 3000];
const DNS_ERROR_PATTERNS = [/ENOTFOUND/, /getaddrinfo/i, /EAI_AGAIN/];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDnsError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return DNS_ERROR_PATTERNS.some((p) => p.test(error.message));
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /fetch|network|connect|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ERR_CONN/i.test(error.message);
}

export function mapStorageError(error: unknown): StorageError {
  const timestamp = new Date();
  const original = error instanceof Error ? error.message : String(error);

  if (isDnsError(error)) {
    return {
      code: "SERVICE_UNAVAILABLE",
      message: "El servicio de almacenamiento no está disponible en este momento. Intenta más tarde.",
      severity: "warning",
      details: { original },
      timestamp,
    };
  }

  if (isNetworkError(error)) {
    return {
      code: "NETWORK_ERROR",
      message: "Error de conexión al servicio de almacenamiento. Verifica tu conexión a internet.",
      severity: "warning",
      details: { original },
      timestamp,
    };
  }

  const storageError = error as { statusCode?: string | number; status?: string | number; message?: string } | null;

  const rawStatus = storageError?.statusCode ?? storageError?.status;
  const status = rawStatus !== undefined ? Number(rawStatus) : undefined;
  const message = storageError?.message ?? "";

  if (status === 403 || /row-level security|RLS|policy/i.test(message)) {
    return {
      code: "FORBIDDEN",
      message: "No tienes permisos para realizar esta operación de almacenamiento.",
      severity: "error",
      details: { original, status },
      timestamp,
    };
  }

  if (status === 404 || /not found/i.test(message)) {
    return {
      code: "NOT_FOUND",
      message: "El archivo solicitado no fue encontrado en el almacenamiento.",
      severity: "error",
      details: { original, status },
      timestamp,
    };
  }

  if (status && status >= 500) {
    return {
      code: "INTERNAL_SERVER_ERROR",
      message: "Error interno del servidor de almacenamiento. Intenta más tarde.",
      severity: "error",
      details: { original, status },
      timestamp,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Ocurrió un error inesperado al subir el archivo.",
    severity: "error",
    details: { original, status },
    timestamp,
  };
}

export class StorageService {
  private supabase: SupabaseClient;
  private readonly maxRetries = 2;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      throw new Error(
        "StorageService: supabaseUrl y supabaseAnonKey son requeridas. " +
        "Valida VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env.local",
      );
    }
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  private async requestWithRetry<T>(fn: () => Promise<{ data: T | null; error: unknown }>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await fn();
        if (error) throw error;
        if (data === null) throw new Error("Supabase storage returned null data without error");
        return data;
      } catch (err: unknown) {
        lastError = err;
        if (attempt < this.maxRetries && (isDnsError(err) || isNetworkError(err))) {
          await delay(RETRY_DELAYS[attempt]);
          continue;
        }
        throw mapStorageError(err);
      }
    }

    throw mapStorageError(lastError);
  }

  async uploadAvatar(userId: string, file: File): Promise<StorageUploadResult> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const bucket = STORAGE_BUCKETS.AVATARS;
    await this.requestWithRetry(() =>
      this.supabase.storage.from(bucket.name).upload(path, file, { upsert: true }),
    );

    const { data: urlData } = this.supabase.storage
      .from(bucket.name)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path,
      bucket: bucket.name,
    };
  }

  async uploadResource(userId: string, file: File): Promise<StorageUploadResult> {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${Date.now()}-${file.name}`;

    const bucket = STORAGE_BUCKETS.RESOURCES;
    await this.requestWithRetry(() =>
      this.supabase.storage.from(bucket.name).upload(path, file, { upsert: true }),
    );

    const { data: urlData } = this.supabase.storage
      .from(bucket.name)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path,
      bucket: bucket.name,
    };
  }

  async uploadChatImage(conversationId: string, file: File): Promise<StorageUploadResult> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${conversationId}/${Date.now()}.${ext}`;

    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      webp: "image/webp", gif: "image/gif", bmp: "image/bmp",
    };
    const contentType = file.type || mimeMap[ext] || "application/octet-stream";

    const bucket = STORAGE_BUCKETS.CHAT_MEDIA;
    await this.requestWithRetry(() =>
      this.supabase.storage.from(bucket.name).upload(path, file, { upsert: true, contentType }),
    );

    const { data: urlData } = this.supabase.storage
      .from(bucket.name)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path,
      bucket: bucket.name,
    };
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    await this.requestWithRetry(() =>
      this.supabase.storage.from(bucket).remove([path]),
    );
  }
}
