import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

// Modulo de infraestructura para subir multimedia de chat a Supabase Storage.
// Incluye normalizacion de MIME y fallback de buckets para compatibilidad entre entornos.

export interface ChatMediaUploadInput {
  userId: string;
  uri: string;
  mimeType: string;
  fileName: string;
}

function normalizeMimeType(mimeType: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const normalized = mimeType.trim().toLowerCase();

  // Mapeos específicos para extensiones comunes si el mimeType es genérico o nulo
  const mimeMap: Record<string, string> = {
    "m4a": "audio/mp4",
    "md": "text/markdown",
    "markdown": "text/markdown",
    "pdf": "application/pdf",
    "txt": "text/plain",
    "zip": "application/zip",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
  };

  if (mimeMap[ext]) {
    return mimeMap[ext];
  }

  return normalized || "application/octet-stream";
}

async function uploadToBuckets(
  storagePath: string,
  arrayBuffer: ArrayBuffer,
  mimeCandidates: string[],
  bucketCandidates = ["chat-media", "resources"],
): Promise<string> {
  let lastError: string | null = null;

  for (const bucket of bucketCandidates) {
    for (const mimeType of mimeCandidates) {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

      if (uploadError) {
        lastError = uploadError.message;
        continue;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      return data.publicUrl;
    }
  }

  throw new Error(lastError ?? "No se pudo subir el archivo del chat.");
}

async function uploadChatMedia(input: ChatMediaUploadInput): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(input.uri, {
    encoding: "base64",
  });

  const arrayBuffer = decode(base64);
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${input.userId}/chat/${Date.now()}_${safeName}`;
  const primaryMime = normalizeMimeType(input.mimeType, safeName);
  const mimeCandidates = [primaryMime, "application/octet-stream"];

  return uploadToBuckets(storagePath, arrayBuffer, mimeCandidates, ["chat-media", "resources"]);
}

export async function uploadChatImage(
  userId: string,
  image: { uri: string; mimeType: string; fileName: string },
): Promise<string> {
  return uploadChatMedia({
    userId,
    uri: image.uri,
    mimeType: image.mimeType,
    fileName: image.fileName,
  });
}

export async function uploadChatAudio(
  userId: string,
  audioUri: string,
  fileName = `voice_${Date.now()}.m4a`,
  mimeType = "audio/x-m4a",
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: "base64",
  });

  const arrayBuffer = decode(base64);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/chat/${Date.now()}_${safeName}`;
  const normalized = normalizeMimeType(mimeType, safeName);

  const audioMimeCandidates = [
    normalized,
    "audio/x-m4a",
    "audio/m4a",
    "audio/mp4",
    "audio/aac",
    "audio/mpeg",
  ];

  // Prioriza bucket dedicado de audio y luego buckets legacy.
  return uploadToBuckets(
    storagePath,
    arrayBuffer,
    Array.from(new Set(audioMimeCandidates)),
    ["chat-audio", "chat-media", "resources"],
  );
}
