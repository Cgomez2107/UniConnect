import { supabase } from "@/lib/supabase"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system/legacy"
import type { CreateStudyResourcePayload, StudyResource } from "@/types"
import type { IResourceUploadRepository } from "../../domain/repositories/IResourceUploadRepository"

const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "doc",
  "xlsx",
  "xls",
  "pptx",
  "ppt",
  "txt",
  "jpg",
  "jpeg",
  "png",
] as const

const MAX_FILE_SIZE_KB = 10_240

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
}

export class SupabaseResourceUploadRepository implements IResourceUploadRepository {
  validateFileFormat(fileName: string): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
    return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
  }

  validateFileSize(sizeBytes: number): boolean {
    return sizeBytes / 1024 <= MAX_FILE_SIZE_KB
  }

  async uploadFromDevice(
    userId: string,
    payload: CreateStudyResourcePayload & {
      file_name: string
      file_size_bytes: number
    }
  ): Promise<StudyResource> {
    const { subject_id, title, description, file_uri, file_name, file_size_bytes } = payload

    if (!this.validateFileFormat(file_name)) {
      throw new Error(`Formato no permitido. Usa: ${ALLOWED_EXTENSIONS.join(", ")}`)
    }

    if (!this.validateFileSize(file_size_bytes)) {
      throw new Error("El archivo excede el máximo de 10 MB.")
    }

    const { data: userPrograms, error: upError } = await supabase
      .from("user_programs")
      .select("program_id")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .limit(1)

    if (upError) {
      throw new Error("No se pudo resolver el programa académico del usuario.")
    }

    let programId = userPrograms?.[0]?.program_id as string | undefined

    if (!programId) {
      const { data: subjectLinks, error: subjectLinkError } = await supabase
        .from("program_subjects")
        .select("program_id")
        .eq("subject_id", subject_id)
        .limit(1)

      if (subjectLinkError) {
        throw new Error("No se pudo resolver el programa de la materia seleccionada.")
      }

      programId = subjectLinks?.[0]?.program_id as string | undefined
    }

    if (!programId) {
      throw new Error("No se encontró un programa asociado a la materia seleccionada.")
    }

    const base64 = await FileSystem.readAsStringAsync(file_uri, {
      encoding: "base64",
    })

    const arrayBuffer = decode(base64)
    const ext = file_name.split(".").pop()?.toLowerCase() ?? "pdf"
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream"
    const storagePath = `${userId}/${Date.now()}_${file_name}`

    const { error: uploadError } = await supabase.storage.from("resources").upload(storagePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    })

    if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from("resources").getPublicUrl(storagePath)
    const fileUrl = urlData.publicUrl
    const fileSizeKb = Math.round(file_size_bytes / 1024)

    const { data, error: insertError } = await supabase
      .from("study_resources")
      .insert({
        user_id: userId,
        program_id: programId,
        subject_id,
        title,
        description: description ?? null,
        file_url: fileUrl,
        file_name,
        file_type: ext.toUpperCase(),
        file_size_kb: fileSizeKb,
      })
      .select("*, profiles(full_name, avatar_url), subjects(name)")
      .single()

    if (insertError) throw new Error(`Error al guardar recurso: ${insertError.message}`)

    return data as StudyResource
  }
}
