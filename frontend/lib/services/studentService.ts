/**
 * lib/services/studentService.ts
 * Servicio de búsqueda de compañeros por materia — US-005
 *
 * Funcionalidades:
 *   - Buscar estudiantes inscritos en una materia específica (RPC)
 *   - Obtener perfil público de un estudiante con materias en común
 *
 * Dependencias DB:
 *   - RPC search_students_by_subject (migración 20260307)
 *   - Tablas: profiles, user_subjects, user_programs, programs, faculties
 *
 * NOTA: No usa Map ni Set — Hermes (React Native) no soporta sus iteradores.
 */

import { supabase } from "@/lib/supabase"
import type { StudentPublicProfile, StudentSearchResult } from "@/types"

// ── Constantes ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 20

// ── Buscar estudiantes por materia ────────────────────────────────────────────

/**
 * Llama a la RPC search_students_by_subject para obtener
 * estudiantes inscritos en la materia indicada.
 *
 * Excluye automáticamente al usuario autenticado.
 * Soporta paginación con limit/offset.
 *
 * @param subjectId  ID de la materia a buscar
 * @param page       Número de página (base 0)
 * @param pageSize   Cantidad de resultados por página
 * @returns Lista de estudiantes encontrados
 */
export async function searchStudentsBySubject(
  subjectId: string,
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<StudentSearchResult[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No hay sesión activa.")

  const { data, error } = await supabase.rpc("search_students_by_subject", {
    p_subject_id: subjectId,
    p_user_id: user.id,
    p_limit: pageSize,
    p_offset: page * pageSize,
  })

  if (error) throw new Error(`Error al buscar estudiantes: ${error.message}`)

  return (data ?? []) as StudentSearchResult[]
}

// ── Perfil público de un estudiante ───────────────────────────────────────────

/**
 * Obtiene el perfil público de un estudiante junto con las materias
 * que comparte con el usuario autenticado.
 *
 * Flujo:
 *   1. Cargar perfil básico + programa principal del estudiante objetivo
 *   2. Cargar materias del estudiante objetivo
 *   3. Cargar materias del usuario autenticado
 *   4. Calcular intersección (materias en común)
 *
 * @param studentId  ID del estudiante cuyo perfil se quiere ver
 * @returns Perfil público con materias en común, o null si no existe
 */
export async function getStudentPublicProfile(
  studentId: string
): Promise<StudentPublicProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No hay sesión activa.")

  // Consultas en paralelo: perfil + materias del objetivo + materias del usuario
  const [profileResult, targetSubjectsResult, mySubjectsResult] =
    await Promise.all([
      // Perfil básico del estudiante objetivo
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, semester")
        .eq("id", studentId)
        .eq("is_active", true)
        .single(),

      // Materias del estudiante objetivo
      supabase
        .from("user_subjects")
        .select("subject_id, subjects ( id, name )")
        .eq("user_id", studentId),

      // Materias del usuario autenticado
      supabase
        .from("user_subjects")
        .select("subject_id")
        .eq("user_id", user.id),
    ])

  if (profileResult.error || !profileResult.data) return null

  // Programa principal del estudiante (consulta separada por join complejo)
  const { data: programData } = await supabase
    .from("user_programs")
    .select("is_primary, programs ( name, faculties ( name ) )")
    .eq("user_id", studentId)
    .order("is_primary", { ascending: false })
    .limit(1)

  // Extraer IDs de materias del usuario autenticado para intersección
  const mySubjectIds: string[] = []
  const myRows: any[] = mySubjectsResult.data ?? []
  for (let i = 0; i < myRows.length; i++) {
    mySubjectIds.push(myRows[i].subject_id)
  }

  // Calcular materias en común (intersección sin Set)
  const sharedSubjects: { id: string; name: string }[] = []
  const targetRows: any[] = targetSubjectsResult.data ?? []
  for (let i = 0; i < targetRows.length; i++) {
    const row = targetRows[i]
    if (mySubjectIds.indexOf(row.subject_id) !== -1) {
      // Extraer datos de la materia desde el join
      const subjectData = Array.isArray(row.subjects)
        ? row.subjects[0]
        : row.subjects
      if (subjectData) {
        sharedSubjects.push({
          id: String(subjectData.id),
          name: String(subjectData.name),
        })
      }
    }
  }

  // Extraer programa y facultad del primer resultado
  let programName: string | null = null
  let facultyName: string | null = null
  const progRows: any[] = programData ?? []
  if (progRows.length > 0) {
    const prog = Array.isArray(progRows[0].programs)
      ? progRows[0].programs[0]
      : progRows[0].programs
    programName = prog?.name ?? null
    const fac = Array.isArray(prog?.faculties)
      ? prog.faculties[0]
      : prog?.faculties
    facultyName = fac?.name ?? null
  }

  const profile = profileResult.data

  return {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    semester: profile.semester,
    program_name: programName,
    faculty_name: facultyName,
    shared_subjects: sharedSubjects,
  }
}
