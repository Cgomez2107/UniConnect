/**
 * lib/services/studyRequestsService.ts
 * Servicio para gestionar solicitudes de estudio — US-005 + US-006
 *
 * Relación usada para materias inscritas:
 *   user_subjects → subjects
 *
 * Relación usada para el feed:
 *   study_requests → profiles (autor)
 *   study_requests → subjects → program_subjects → programs → faculties
 *
 * NOTA: Sin Map ni Set — Hermes (React Native) no soporta sus iteradores.
 */

import { supabase } from "@/lib/supabase";

// ── Tipos — US-005 ─────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
}

export interface CreateStudyRequestPayload {
  title: string;
  description: string;
  subject_id: string;
  max_members: number;
}

// ── Tipos — US-006 ─────────────────────────────────────────────────────────────

export interface FeedStudyRequest {
  id: string;
  author_id: string;
  subject_id: string;
  title: string;
  description: string;
  max_members: number;
  status: "abierta" | "cerrada";
  created_at: string;
  // Mapeados desde joins — forma que espera CardSolicitud
  author: {
    full_name: string;
    avatar_url?: string;
    career?: string;
  };
  subject_name: string;
  faculty_name: string;
  applications_count?: number;
  // compatibilidad con CardSolicitud que lee profiles
  profiles?: { full_name: string; avatar_url: string | null };
}

export interface FeedFilters {
  search?: string;
  /** IDs de materias del usuario para filtrar por materias en común */
  subjectIds?: string[];
}

// ── Materias inscritas del estudiante ─────────────────────────────────────────

/**
 * Devuelve solo las materias inscritas del estudiante logueado.
 * Ruta: user_subjects → subjects
 */
export async function getEnrolledSubjectsForUser(): Promise<Subject[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No hay sesión activa.");

  const { data, error } = await supabase
    .from("user_subjects")
    .select(`
      subject_id,
      subjects (
        id,
        name
      )
    `)
    .eq("user_id", user.id);

  if (error) throw error;

  const rows: any[] = data ?? [];
  const subjectRecord: Record<string, Subject> = {};

  for (let i = 0; i < rows.length; i++) {
    const subjectsField = rows[i].subjects;
    const subjectList = Array.isArray(subjectsField)
      ? subjectsField
      : subjectsField
      ? [subjectsField]
      : [];

    for (let j = 0; j < subjectList.length; j++) {
      const s = subjectList[j];
      if (!s || !s.id) continue;
      const sid = String(s.id);
      if (!subjectRecord[sid]) {
        subjectRecord[sid] = { id: sid, name: String(s.name) };
      }
    }
  }

  return Object.values(subjectRecord).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// ── Crear solicitud de estudio ─────────────────────────────────────────────────

/**
 * Inserta una nueva solicitud de estudio.
 * RLS valida que author_id = auth.uid()
 */
export async function createStudyRequest(
  payload: CreateStudyRequestPayload
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No hay sesión activa.");

  const insertData = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    subject_id: payload.subject_id,
    max_members: payload.max_members,
    author_id: user.id,
    status: "abierta",
    is_active: true,
  };

  const { error } = await supabase.from("study_requests").insert(insertData);

  if (error) throw error;
}

// ── Feed de solicitudes ────────────────────────────────────────────────────────

/**
 * Trae solicitudes activas con join de autor, materia y facultad.
 * Mapea la respuesta de Supabase al tipo que espera CardSolicitud.
 *
 * Jerarquía de join:
 *   study_requests
 *     → profiles        (autor)
 *     → subjects
 *         → program_subjects
 *             → programs
 *                 → faculties
 */
export async function getFeedRequests(
  filters?: FeedFilters,
  page = 0,
  pageSize = 10
): Promise<FeedStudyRequest[]> {
  let query = supabase
    .from("study_requests")
    .select(`
      id, author_id, subject_id, title, description,
      max_members, status, created_at,
      profiles (
        full_name,
        avatar_url,
        user_programs (
          is_primary,
          programs ( name )
        )
      ),
      subjects (
        name,
        program_subjects (
          programs (
            faculties ( name )
          )
        )
      )
    `)
    .eq("is_active", true)
    .eq("status", "abierta")
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  // Filtro por materias en común del usuario
  if (filters?.subjectIds && filters.subjectIds.length > 0) {
    query = query.in("subject_id", filters.subjectIds);
  }

  // Filtro de búsqueda por título
  if (filters?.search && filters.search.trim() !== "") {
    query = query.ilike("title", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows: any[] = data ?? [];
  const result: FeedStudyRequest[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    // Extraer nombre de facultad desde la cadena larga de joins
    let facultyName = "Sin facultad";
    const psArr: any[] = r.subjects?.program_subjects ?? [];
    if (psArr.length > 0) {
      const prog = Array.isArray(psArr[0]?.programs)
        ? psArr[0].programs[0]
        : psArr[0]?.programs;
      const fac = Array.isArray(prog?.faculties)
        ? prog.faculties[0]
        : prog?.faculties;
      if (fac?.name) facultyName = fac.name;
    }

    // Extraer carrera del autor (programa principal)
    let authorCareer = "";
    const upArr: any[] = r.profiles?.user_programs ?? [];
    for (let j = 0; j < upArr.length; j++) {
      const up = upArr[j];
      if (up.is_primary) {
        const prog = Array.isArray(up.programs) ? up.programs[0] : up.programs;
        authorCareer = prog?.name ?? "";
        break;
      }
    }
    // Si no hay programa principal, tomar el primero disponible
    if (!authorCareer && upArr.length > 0) {
      const prog = Array.isArray(upArr[0].programs) ? upArr[0].programs[0] : upArr[0].programs;
      authorCareer = prog?.name ?? "";
    }

    result.push({
      id: r.id,
      author_id: r.author_id,
      subject_id: r.subject_id,
      title: r.title,
      description: r.description,
      max_members: r.max_members,
      status: r.status,
      created_at: r.created_at,
      author: {
        full_name: r.profiles?.full_name ?? "Usuario",
        avatar_url: r.profiles?.avatar_url ?? undefined,
        career: authorCareer || undefined,
      },
      profiles: {
        full_name: r.profiles?.full_name ?? "Usuario",
        avatar_url: r.profiles?.avatar_url ?? null,
      },
      subject_name: r.subjects?.name ?? "Sin materia",
      faculty_name: facultyName,
    });
  }

  return result;
}