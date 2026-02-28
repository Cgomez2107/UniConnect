/**
 * lib/services/studyRequestsService.ts
 * Servicio para gestionar solicitudes de estudio — US-005
 *
 * Relación usada para materias:
 *   user_subjects → subjects  (solo las materias que está cursando el estudiante)
 *
 * NOTA: No se usa Map ni Set — Hermes (React Native) no soporta sus iteradores.
 */

import { supabase } from "@/lib/supabase";

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
}

export type Modality = "presencial" | "virtual" | "híbrido";

export interface CreateStudyRequestPayload {
  title: string;
  description: string;
  subject_id: string;
  modality: Modality;
  max_members: number;
}

// ── Materias que está cursando el estudiante ──────────────────────────────────

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

// ── Study Requests ─────────────────────────────────────────────────────────────

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

  // La BD usa 'hibrido' sin tilde en el CHECK constraint
  const modalityMap: Record<Modality, string> = {
    presencial: "presencial",
    virtual: "virtual",
    híbrido: "hibrido",
  };

  const insertData = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    subject_id: payload.subject_id,
    modality: modalityMap[payload.modality],
    max_members: payload.max_members,
    author_id: user.id,
    status: "abierta",
  };

  const { error } = await supabase.from("study_requests").insert(insertData);

  if (error) throw error;
}