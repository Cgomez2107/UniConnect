/**
 * lib/services/facultyService.ts
 * CRUD de Facultades, Programas y Materias
 * Solo el rol "admin" puede escribir — RLS lo garantiza en Supabase.
 * Los estudiantes solo pueden leer (SELECT).
 *
 * Tipos importados desde @/types — no se redefinen aqui.
 */

import { supabase } from "@/lib/supabase"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client"
import type { Faculty, Program, Subject } from "@/types"

// ══════════════════════════════════════════════════════════════════════════════
// FACULTADES
// ══════════════════════════════════════════════════════════════════════════════

export async function getFaculties(): Promise<Faculty[]> {
  return apiGet<Faculty>("faculties", (q) => q.select("*").eq("is_active", true).order("name"))
}

export async function createFaculty(name: string, code?: string): Promise<Faculty> {
  return apiPost<Faculty>("faculties", { name: name.trim(), code: code?.trim() ?? null })
}

export async function updateFaculty(
  id: string,
  updates: { name?: string; code?: string }
): Promise<Faculty> {
  return apiPatch<Faculty>(
    "faculties",
    { name: updates.name?.trim(), code: updates.code?.trim() ?? null },
    (q) => q.eq("id", id)
  )
}

export async function deleteFaculty(id: string): Promise<void> {
  await apiDelete("faculties", (q) => q.eq("id", id))
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRAMAS
// ══════════════════════════════════════════════════════════════════════════════

export async function getPrograms(): Promise<Program[]> {
  const rows = await apiGet<any>("programs", (q) =>
    q.select("*, faculties ( name )").eq("is_active", true).order("name")
  )
  return rows.map((p: any) => ({ ...p, faculty_name: p.faculties?.name ?? "" }))
}

export async function getProgramsByFaculty(facultyId: string): Promise<Program[]> {
  return apiGet<Program>("programs", (q) =>
    q.select("*").eq("faculty_id", facultyId).eq("is_active", true).order("name")
  )
}

export async function createProgram(
  name: string,
  facultyId: string,
  code?: string
): Promise<Program> {
  return apiPost<Program>("programs", {
    name: name.trim(),
    faculty_id: facultyId,
    code: code?.trim() ?? null,
  })
}

export async function updateProgram(
  id: string,
  updates: { name?: string; faculty_id?: string; code?: string }
): Promise<Program> {
  return apiPatch<Program>(
    "programs",
    {
      name: updates.name?.trim(),
      faculty_id: updates.faculty_id,
      code: updates.code?.trim() ?? null,
    },
    (q) => q.eq("id", id)
  )
}

export async function deleteProgram(id: string): Promise<void> {
  await apiDelete("programs", (q) => q.eq("id", id))
}

// ══════════════════════════════════════════════════════════════════════════════
// MATERIAS
// ══════════════════════════════════════════════════════════════════════════════

// Trae todas las materias con sus programas vinculados (N:N via program_subjects)
export async function getSubjects(): Promise<Subject[]> {
  const rows = await apiGet<any>("subjects", (q) =>
    q
      .select("*, program_subjects ( programs ( id, name, faculty_id ) )")
      .eq("is_active", true)
      .order("name")
  )
  return rows.map((s: any) => ({
    ...s,
    programs: (s.program_subjects ?? []).map((ps: any) => ps.programs).filter(Boolean),
    program_subjects: undefined,
  }))
}

export async function getSubjectsByProgram(programId: string): Promise<Subject[]> {
  const rows = await apiGet<any>("program_subjects", (q) =>
    q.select("subjects ( * )").eq("program_id", programId)
  )
  return rows.map((ps: any) => ps.subjects).filter(Boolean)
}

// createSubject y updateSubject mantienen supabase directo porque son
// operaciones multi-paso (transaccionales):  no es posible modelarlas con
// un solo apiPost / apiPatch sin perder coherencia.
export async function createSubject(
  name: string,
  programIds: string[],
  code?: string
): Promise<Subject> {
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .insert({ name: name.trim(), code: code?.trim() ?? null })
    .select()
    .single()

  if (subjectError) throw subjectError

  if (programIds.length > 0) {
    const links = programIds.map((pid) => ({ program_id: pid, subject_id: subject.id }))
    const { error: linkError } = await supabase.from("program_subjects").insert(links)
    if (linkError) throw linkError
  }

  return subject as Subject
}

export async function updateSubject(
  id: string,
  updates: { name?: string; code?: string },
  programIds?: string[]
): Promise<Subject> {
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .update({ name: updates.name?.trim(), code: updates.code?.trim() ?? null })
    .eq("id", id)
    .select()
    .single()

  if (subjectError) throw subjectError

  if (programIds !== undefined) {
    const { error: deleteError } = await supabase
      .from("program_subjects")
      .delete()
      .eq("subject_id", id)
    if (deleteError) throw deleteError

    if (programIds.length > 0) {
      const links = programIds.map((pid) => ({ program_id: pid, subject_id: id }))
      const { error: linkError } = await supabase.from("program_subjects").insert(links)
      if (linkError) throw linkError
    }
  }

  return subject as Subject
}

export async function deleteSubject(id: string): Promise<void> {
  // Los program_subjects se eliminan solos por CASCADE
  await apiDelete("subjects", (q) => q.eq("id", id))
}