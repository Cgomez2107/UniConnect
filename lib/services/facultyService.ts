/**
 * lib/services/facultyService.ts
 * CRUD de Facultades, Programas y Materias
 * Solo el rol "admin" puede escribir — RLS lo garantiza en Supabase
 * Los estudiantes solo pueden leer (SELECT)
 */

import { supabase } from "@/lib/supabase"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface Faculty {
  id: string
  name: string
  code: string | null
  is_active: boolean
  created_at: string
}

export interface Program {
  id: string
  name: string
  code: string | null
  faculty_id: string
  is_active: boolean
  created_at: string
  // join
  faculties?: { name: string }
}

export interface Subject {
  id: string
  name: string
  code: string | null
  is_active: boolean
  created_at: string
  // join via program_subjects
  programs?: Program[]
}

export interface ProgramSubject {
  program_id: string
  subject_id: string
}

// ══════════════════════════════════════════════════════════════════════════════
// FACULTADES
// ══════════════════════════════════════════════════════════════════════════════

export async function getFaculties(): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) throw error
  return data ?? []
}

export async function createFaculty(name: string, code?: string): Promise<Faculty> {
  const { data, error } = await supabase
    .from("faculties")
    .insert({ name: name.trim(), code: code?.trim() ?? null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFaculty(
  id: string,
  updates: { name?: string; code?: string }
): Promise<Faculty> {
  const { data, error } = await supabase
    .from("faculties")
    .update({
      name: updates.name?.trim(),
      code: updates.code?.trim() ?? null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFaculty(id: string): Promise<void> {
  const { error } = await supabase
    .from("faculties")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRAMAS
// ══════════════════════════════════════════════════════════════════════════════

// Trae todos los programas con el nombre de la facultad incluido (join)
export async function getPrograms(): Promise<(Program & { faculty_name: string })[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      *,
      faculties ( name )
    `)
    .eq("is_active", true)
    .order("name")

  if (error) throw error

  return (data ?? []).map((p: any) => ({
    ...p,
    faculty_name: p.faculties?.name ?? "",
  }))
}

// Programas de una facultad específica
export async function getProgramsByFaculty(
  facultyId: string
): Promise<Program[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("faculty_id", facultyId)
    .eq("is_active", true)
    .order("name")

  if (error) throw error
  return data ?? []
}

export async function createProgram(
  name: string,
  facultyId: string,
  code?: string
): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .insert({
      name: name.trim(),
      faculty_id: facultyId,
      code: code?.trim() ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProgram(
  id: string,
  updates: { name?: string; faculty_id?: string; code?: string }
): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .update({
      name: updates.name?.trim(),
      faculty_id: updates.faculty_id,
      code: updates.code?.trim() ?? null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// MATERIAS
// ══════════════════════════════════════════════════════════════════════════════

// Trae todas las materias con sus programas vinculados (N:N via program_subjects)
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(`
      *,
      program_subjects (
        programs ( id, name, faculty_id )
      )
    `)
    .eq("is_active", true)
    .order("name")

  if (error) throw error

  return (data ?? []).map((s: any) => ({
    ...s,
    programs: (s.program_subjects ?? [])
      .map((ps: any) => ps.programs)
      .filter(Boolean),
    program_subjects: undefined, // limpiar el join
  }))
}

// Materias disponibles para un programa específico
export async function getSubjectsByProgram(programId: string): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("program_subjects")
    .select(`
      subjects ( * )
    `)
    .eq("program_id", programId)

  if (error) throw error

  return (data ?? [])
    .map((ps: any) => ps.subjects)
    .filter(Boolean)
}

export async function createSubject(
  name: string,
  programIds: string[],
  code?: string
): Promise<Subject> {
  // 1. Crear la materia
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .insert({ name: name.trim(), code: code?.trim() ?? null })
    .select()
    .single()

  if (subjectError) throw subjectError

  // 2. Vincular a los programas (N:N)
  if (programIds.length > 0) {
    const links = programIds.map((pid) => ({
      program_id: pid,
      subject_id: subject.id,
    }))

    const { error: linkError } = await supabase
      .from("program_subjects")
      .insert(links)

    if (linkError) throw linkError
  }

  return subject
}

export async function updateSubject(
  id: string,
  updates: { name?: string; code?: string },
  programIds?: string[]  // si se pasa, reemplaza los vínculos N:N
): Promise<Subject> {
  // 1. Actualizar la materia
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .update({ name: updates.name?.trim(), code: updates.code?.trim() ?? null })
    .eq("id", id)
    .select()
    .single()

  if (subjectError) throw subjectError

  // 2. Si se especifican programas, reemplazar los vínculos
  if (programIds !== undefined) {
    // Borrar vínculos actuales
    const { error: deleteError } = await supabase
      .from("program_subjects")
      .delete()
      .eq("subject_id", id)

    if (deleteError) throw deleteError

    // Insertar los nuevos
    if (programIds.length > 0) {
      const links = programIds.map((pid) => ({
        program_id: pid,
        subject_id: id,
      }))

      const { error: linkError } = await supabase
        .from("program_subjects")
        .insert(links)

      if (linkError) throw linkError
    }
  }

  return subject
}

export async function deleteSubject(id: string): Promise<void> {
  // Los program_subjects se eliminan solos por CASCADE
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id)

  if (error) throw error
}