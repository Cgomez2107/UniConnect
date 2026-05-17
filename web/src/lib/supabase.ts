/**
 * @deprecated
 * Importa desde `@uniconnect/shared-api/services` en lugar de `@/lib/supabase`.
 *
 *   ✅ import { StorageService } from "@uniconnect/shared-api/services";
 *   ✅ const storage = new StorageService(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
 *
 * Este wrapper se mantiene para compatibilidad hasta que todas las
 * páginas migren (Sprint 6).
 */

import { createClient } from "@supabase/supabase-js";
import { StorageService, STORAGE_BUCKETS } from "@uniconnect/shared-api/services";
import type { StorageUploadResult } from "@uniconnect/shared-api/services";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** @deprecated Usa new StorageService(…) directamente */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let _storageService: StorageService | null = null;
function getStorageService(): StorageService {
  if (!_storageService) {
    _storageService = new StorageService(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _storageService;
}

/** @deprecated Usa storage.uploadAvatar(userId, file) */
export async function uploadAvatarFile(userId: string, file: File): Promise<string | null> {
  try {
    const result = await getStorageService().uploadAvatar(userId, file);
    return result.url;
  } catch (err) {
    console.error("Storage uploadAvatarFile failed:", err);
    return null;
  }
}

/** @deprecated Usa storage.uploadResource(userId, file) */
export async function uploadResourceFile(userId: string, file: File): Promise<string | null> {
  try {
    const result = await getStorageService().uploadResource(userId, file);
    return result.url;
  } catch (err) {
    console.error("Storage uploadResourceFile failed:", err);
    return null;
  }
}

/** @deprecated Usa storage.uploadChatImage(conversationId, file) */
export async function uploadChatImageFile(conversationId: string, file: File): Promise<string | null> {
  try {
    const result = await getStorageService().uploadChatImage(conversationId, file);
    return result.url;
  } catch (err) {
    console.error("Storage uploadChatImageFile failed:", err);
    return null;
  }
}

export { StorageService, STORAGE_BUCKETS, getStorageService };
export type { StorageUploadResult };
