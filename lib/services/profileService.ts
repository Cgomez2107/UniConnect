/**
 * lib/services/profileService.ts
 * Perfil del estudiante: leer, actualizar, programas y materias
 */

import { supabase } from "@/lib/supabase"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system/legacy"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  role: "estudiante" | "admin"
  semester: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProgram {
  user_id: string
  program_id: string
  is_primary: boolean
  enrolled_at: string
  // join
  programs?: {
    id: string
    name: string
    faculty_id: string
    faculties?: { name: string }
  }
}

export interface UserSubject {
  user_id: string
  subject_id: string
  enrolled_at: string
  // join
  subjects?: { id: string; name: string }
}

// ── Leer perfil ───────────────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
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
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
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
  const { data, error } = await supabase
    .from("user_programs")
    .select(`
      *,
      programs (
        id,
        name,
        faculty_id,
        faculties ( name )
      )
    `)
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })

  if (error) throw error
  return data ?? []
}

// Agregar un programa al perfil del estudiante
export async function addMyProgram(
  userId: string,
  programId: string,
  isPrimary = false
): Promise<void> {
  if (isPrimary) {
    await supabase
      .from("user_programs")
      .update({ is_primary: false })
      .eq("user_id", userId)
  }

  const { error } = await supabase
    .from("user_programs")
    .insert({ user_id: userId, program_id: programId, is_primary: isPrimary })

  if (error) throw error
}

// Eliminar un programa del perfil
export async function removeMyProgram(
  userId: string,
  programId: string
): Promise<void> {
  const { error } = await supabase
    .from("user_programs")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId)

  if (error) throw error
}

// Asignar o cambiar el programa del estudiante
export async function setPrimaryProgram(
  userId: string,
  programId: string
): Promise<void> {
  await supabase
    .from("user_programs")
    .delete()
    .eq("user_id", userId)

  const { error } = await supabase
    .from("user_programs")
    .insert({
      user_id: userId,
      program_id: programId,
      is_primary: true,
    })

  if (error) throw error
}

// ── Materias actuales del usuario ─────────────────────────────────────────────
export async function getMySubjects(userId: string): Promise<UserSubject[]> {
  const { data, error } = await supabase
    .from("user_subjects")
    .select(`
      *,
      subjects ( id, name )
    `)
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

// Agregar una materia al perfil
export async function addMySubject(
  userId: string,
  subjectId: string
): Promise<void> {
  const { error } = await supabase
    .from("user_subjects")
    .insert({ user_id: userId, subject_id: subjectId })

  if (error) {
    if (error.message.includes("validate_user_subject")) {
      throw new Error("Esta materia no pertenece a ninguno de tus programas registrados.")
    }
    throw error
  }
}

// Eliminar una materia del perfil
export async function removeMySubject(
  userId: string,
  subjectId: string
): Promise<void> {
  const { error } = await supabase
    .from("user_subjects")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId)

  if (error) throw error
}