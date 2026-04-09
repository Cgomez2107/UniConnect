import { supabase } from "@/lib/supabase"
import { apiGet, apiGetOne, apiPatch } from "@/lib/api/client"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system/legacy"
import type { Profile, UserProgram, UserSubject } from "@/types"
import type { IProfileRepository } from "../../domain/repositories/IProfileRepository"

export class SupabaseProfileRepository implements IProfileRepository {
  private isMissingSetPrimaryProgramRpc(error: unknown): boolean {
    if (!error || typeof error !== "object") return false

    const maybeCode = (error as { code?: string }).code ?? ""
    const maybeMessage = ((error as { message?: string }).message ?? "").toLowerCase()

    return (
      maybeCode === "PGRST202"
      || (maybeMessage.includes("set_primary_program") && maybeMessage.includes("could not find"))
    )
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return apiGetOne<Profile>("profiles", (q) => q.select("*").eq("id", userId).single())
  }

  async updateProfile(
    userId: string,
    updates: {
      bio?: string
      phone_number?: string | null
    }
  ): Promise<Profile> {
    return apiPatch<Profile>("profiles", updates as Record<string, unknown>, (q) => q.eq("id", userId))
  }

  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: "base64",
    })

    const arrayBuffer = decode(base64)
    // En Android algunos URIs pueden no tener extensión válida (content://...).
    // Forzamos una extensión segura para evitar llaves inválidas en Storage.
    const rawExt = imageUri.split(".").pop()?.toLowerCase() ?? ""
    const fileExt = ["jpg", "jpeg", "png", "webp"].includes(rawExt) ? rawExt : "jpg"
    const mimeType = fileExt === "png"
      ? "image/png"
      : fileExt === "webp"
        ? "image/webp"
        : "image/jpeg"
    const filePath = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    })

    if (uploadError) {
      const msg = uploadError.message.toLowerCase()

      if (msg.includes("bucket") && msg.includes("not found")) {
        throw new Error("No existe el bucket 'avatars' en Supabase. Ejecuta la migración de storage para avatares.")
      }

      if (msg.includes("row-level security") || msg.includes("policy")) {
        throw new Error("No tienes permisos para subir avatar. Revisa las políticas del bucket 'avatars'.")
      }

      throw new Error(`Error al subir imagen: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId)
    if (updateError) throw new Error(`Error al guardar URL: ${updateError.message}`)

    return publicUrl
  }

  async getMyPrograms(userId: string): Promise<UserProgram[]> {
    return apiGet<UserProgram>("user_programs", (q) =>
      q
        .select("*, programs ( id, name, faculty_id, faculties ( name ) )")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false })
    )
  }

  async setPrimaryProgram(userId: string, programId: string): Promise<void> {
    const { error } = await supabase.rpc("set_primary_program", {
      p_user_id: userId,
      p_program_id: programId,
    })

    if (!error) return

    if (!this.isMissingSetPrimaryProgramRpc(error)) {
      throw error
    }

    const { error: deleteError } = await supabase
      .from("user_programs")
      .delete()
      .eq("user_id", userId)

    if (deleteError) {
      throw new Error(`No se pudo actualizar programa (fallback-delete): ${deleteError.message}`)
    }

    const { error: insertError } = await supabase
      .from("user_programs")
      .insert({
        user_id: userId,
        program_id: programId,
        is_primary: true,
        enrolled_at: new Date().toISOString(),
      })

    if (insertError) {
      throw new Error(`No se pudo actualizar programa (fallback-insert): ${insertError.message}`)
    }
  }

  async getMySubjects(userId: string): Promise<UserSubject[]> {
    return apiGet<UserSubject>("user_subjects", (q) =>
      q
        .select("*, subjects ( id, name )")
        .eq("user_id", userId)
        .order("enrolled_at", { ascending: false })
    )
  }

  async addMySubject(userId: string, subjectId: string): Promise<void> {
    const { error } = await supabase.from("user_subjects").insert({ user_id: userId, subject_id: subjectId })
    if (error) {
      if (error.message.includes("validate_user_subject")) {
        throw new Error("Esta materia no pertenece a ninguno de tus programas registrados.")
      }
      throw error
    }
  }

  async removeMySubject(userId: string, subjectId: string): Promise<void> {
    const { error } = await supabase
      .from("user_subjects")
      .delete()
      .eq("user_id", userId)
      .eq("subject_id", subjectId)

    if (error) throw error
  }
}
