/**
 * lib/services/profileService.ts
 * Perfil del estudiante: leer, actualizar, subir avatar, programas y materias
 *
 * Tipos importados desde @/types — no se redefinen aqui.
 * uploadAvatar usa supabase.storage directamente (binario) — no pasa por client.ts.
 */

import { supabase } from "@/lib/supabase"
import { apiGet, apiGetOne, apiPatch } from "@/lib/api/client"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system/legacy"
import type { Profile, UserProgram, UserSubject } from "@/types"

// ── Leer perfil ───────────────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  return apiGetOne<Profile>("profiles", (q) => q.select("*").eq("id", userId).single())
}

// ── Actualizar perfil ─────────────────────────────────────────────────────────
export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string
    bio?: string
    semester?: number
    avatar_url?: string
  }
): Promise<Profile> {
  return apiPatch<Profile>("profiles", updates as Record<string, unknown>, (q) =>
    q.eq("id", userId)
  )
}

// ── Subir foto de perfil ──────────────────────────────────────────────────────
/**
 * Sube una imagen al bucket 'avatars' y actualiza avatar_url en profiles.
 * Usa expo-file-system + base64-arraybuffer para evitar el bug de fetch()
 * en Android con URIs locales del ImagePicker.
 *
 * @param userId   - El auth.uid() del usuario autenticado
 * @param imageUri - La URI local devuelta por expo-image-picker
 * @returns La URL pública del avatar subido
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  // 1. Leer el archivo como base64 (funciona en Android e iOS sin problemas)
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: "base64",
  })

  // 2. Convertir base64 → ArrayBuffer (Supabase Storage lo necesita así)
  const arrayBuffer = decode(base64)

  // 3. Determinar extensión y tipo MIME
  const uriParts = imageUri.split(".")
  const fileExt = uriParts[uriParts.length - 1]?.toLowerCase() ?? "jpg"
  const mimeType = fileExt === "png" ? "image/png" : "image/jpeg"

  // 4. Ruta en el bucket: carpeta por usuario, mismo nombre → se sobreescribe
  const filePath = `${userId}/avatar.${fileExt}`

  // 5. Subir al bucket (upsert: reemplaza si ya existe)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)

  // 6. URL pública con cache-buster para forzar refresco en la UI
  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  // 7. Guardar la URL en la tabla profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId)

  if (updateError) throw new Error(`Error al guardar URL: ${updateError.message}`)

  return publicUrl
}

// ── Programas del usuario ─────────────────────────────────────────────────────
export async function getMyPrograms(userId: string): Promise<UserProgram[]> {
  return apiGet<UserProgram>("user_programs", (q) =>
    q
      .select("*, programs ( id, name, faculty_id, faculties ( name ) )")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
  )
}

export async function addMyProgram(
  userId: string,
  programId: string,
  isPrimary = false
): Promise<void> {
  // Si isPrimary, primero desmarcamos los otros — operacion multi-paso, supabase directo
  if (isPrimary) {
    await supabase.from("user_programs").update({ is_primary: false }).eq("user_id", userId)
  }
  const { error } = await supabase
    .from("user_programs")
    .insert({ user_id: userId, program_id: programId, is_primary: isPrimary })
  if (error) throw error
}

export async function removeMyProgram(userId: string, programId: string): Promise<void> {
  const { error } = await supabase
    .from("user_programs")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId)
  if (error) throw error
}

export async function setPrimaryProgram(userId: string, programId: string): Promise<void> {
  // Reemplaza el programa principal — operacion multi-paso, supabase directo
  await supabase.from("user_programs").delete().eq("user_id", userId)
  const { error } = await supabase
    .from("user_programs")
    .insert({ user_id: userId, program_id: programId, is_primary: true })
  if (error) throw error
}

// ── Materias actuales del usuario ─────────────────────────────────────────────
export async function getMySubjects(userId: string): Promise<UserSubject[]> {
  return apiGet<UserSubject>("user_subjects", (q) =>
    q
      .select("*, subjects ( id, name )")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false })
  )
}

export async function addMySubject(userId: string, subjectId: string): Promise<void> {
  // Supabase directo para capturar el error del trigger validate_user_subject
  const { error } = await supabase
    .from("user_subjects")
    .insert({ user_id: userId, subject_id: subjectId })
  if (error) {
    if (error.message.includes("validate_user_subject"))
      throw new Error("Esta materia no pertenece a ninguno de tus programas registrados.")
    throw error
  }
}

export async function removeMySubject(userId: string, subjectId: string): Promise<void> {
  const { error } = await supabase
    .from("user_subjects")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
  if (error) throw error
}