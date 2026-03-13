// CRUD de recursos de estudio (apuntes, ejercicios).
// Flujo: expo-document-picker → base64 → Supabase Storage (bucket "resources") → INSERT en study_resources.

import { supabase } from "@/lib/supabase"
import { apiGet } from "@/lib/api/client"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system/legacy"
import type { StudyResource, CreateStudyResourcePayload } from "@/types"

// Constantes de validación

const ALLOWED_EXTENSIONS = [
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt",
  "jpg", "jpeg", "png",
] as const

const MAX_FILE_SIZE_KB = 10_240 // 10 MB

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

// Validaciones

export function validateFileFormat(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes / 1024 <= MAX_FILE_SIZE_KB
}

// Subir recurso

export async function uploadResource(
  userId: string,
  payload: CreateStudyResourcePayload & {
    file_name: string
    file_size_bytes: number
  }
): Promise<StudyResource> {
  const { subject_id, title, description, file_uri, file_name, file_size_bytes } = payload

  // 1. Validar formato
  if (!validateFileFormat(file_name)) {
    throw new Error(
      `Formato no permitido. Usa: ${ALLOWED_EXTENSIONS.join(", ")}`
    )
  }

  // 2. Validar tamaño
  if (!validateFileSize(file_size_bytes)) {
    throw new Error(`El archivo excede el máximo de 10 MB.`)
  }

  // 3. Obtener programa principal del usuario.
  // Si es admin y no tiene programa, usar el primer programa vinculado a la materia.
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

  // 4. Leer archivo como base64
  const base64 = await FileSystem.readAsStringAsync(file_uri, {
    encoding: "base64",
  })

  // 5. Convertir base64 → ArrayBuffer
  const arrayBuffer = decode(base64)

  // 6. Determinar extensión y MIME
  const ext = file_name.split(".").pop()?.toLowerCase() ?? "pdf"
  const mimeType = MIME_TYPES[ext] ?? "application/octet-stream"

  // 7. Ruta en el bucket: carpeta por usuario + timestamp para unicidad
  const storagePath = `${userId}/${Date.now()}_${file_name}`

  // 8. Subir al bucket "resources"
  const { error: uploadError } = await supabase.storage
    .from("resources")
    .upload(storagePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

  // 9. URL pública
  const { data: urlData } = supabase.storage.from("resources").getPublicUrl(storagePath)
  const fileUrl = urlData.publicUrl

  // 10. Insertar registro en la tabla
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

// Listar recursos por materia

export async function getResourcesBySubject(
  subjectId: string,
  page = 0,
  pageSize = 20
): Promise<StudyResource[]> {
  return apiGet<StudyResource>("study_resources", (q) =>
    q
      .select("*, profiles(full_name, avatar_url), subjects(name)")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
  )
}

// Listar mis recursos

export async function getMyResources(
  userId: string,
  page = 0,
  pageSize = 20
): Promise<StudyResource[]> {
  return apiGet<StudyResource>("study_resources", (q) =>
    q
      .select("*, profiles(full_name, avatar_url), subjects(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
  )
}

// Eliminar recurso

export async function deleteResource(
  resourceId: string,
  fileUrl: string
): Promise<void> {
  // 1. Extraer path del storage desde la URL pública
  const bucketSegment = "/storage/v1/object/public/resources/"
  const pathStart = fileUrl.indexOf(bucketSegment)
  if (pathStart !== -1) {
    const storagePath = fileUrl.substring(pathStart + bucketSegment.length)
    await supabase.storage.from("resources").remove([storagePath])
  }

  // 2. Eliminar registro de la BD
  const { error } = await supabase
    .from("study_resources")
    .delete()
    .eq("id", resourceId)

  if (error) throw new Error(`Error al eliminar recurso: ${error.message}`)
}
