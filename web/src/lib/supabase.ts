import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas en .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  RESOURCES: "resources",
  CHAT_MEDIA: "resources",
  CHAT_AUDIO: "resources",
} as const;

export async function uploadAvatarFile(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("Error uploading avatar:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .getPublicUrl(filePath);

  return urlData?.publicUrl || null;
}

export async function uploadResourceFile(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "bin";
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.RESOURCES)
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("Error uploading resource:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.RESOURCES)
    .getPublicUrl(filePath);

  return urlData?.publicUrl || null;
}

export async function uploadChatImageFile(
  conversationId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${conversationId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.CHAT_MEDIA)
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("Error uploading chat image:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.CHAT_MEDIA)
    .getPublicUrl(filePath);

  return urlData?.publicUrl || null;
}
