import { SupabaseFacultyCatalogRepository } from "./SupabaseFacultyCatalogRepository";
import { fetchApi } from "@/lib/api/httpClient";
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository";
import type { Program, Subject } from "@/types";

/**
 * Repositorio del catálogo académico que delega al microservicio profiles-catalog.
 * Proporciona programas académicos y materias por programa.
 *
 * Fallback a Supabase para operaciones aún no migradas.
 */
export class ApiFacultyCatalogRepository implements IFacultyCatalogRepository {
  private readonly fallback = new SupabaseFacultyCatalogRepository();

  async getPrograms(facultyId?: string): Promise<Program[]> {
    const params = new URLSearchParams();
    if (facultyId) params.set("facultyId", facultyId);

    const data = await fetchApi<Program[]>(
      `/catalog/programs${params.toString() ? `?${params.toString()}` : ""}`,
    );
    return (data ?? []).map(mapProgramFromApi);
  }

  async getSubjectsByProgram(programId: string): Promise<Subject[]> {
    const data = await fetchApi<Subject[]>(
      `/catalog/programs/${programId}/subjects`,
    );
    return (data ?? []).map(mapSubjectFromApi);
  }

  // Operaciones pendientes — fallback a Supabase
  async getFaculties(): Promise<any[]> {
    return this.fallback.getFaculties();
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.fallback.getAllSubjects();
  }

  async getSubjectById(subjectId: string): Promise<Subject | null> {
    return this.fallback.getSubjectById(subjectId);
  }
}

/**
 * Mapea respuesta del microservicio (camelCase) al tipo Program
 */
function mapProgramFromApi(raw: any): Program {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code ?? null,
    faculty_id: raw.facultyId ?? raw.faculty_id,
    faculty_name: raw.facultyName ?? raw.faculty_name ?? undefined,
    is_active: raw.isActive ?? raw.is_active ?? true,
    created_at: raw.createdAt ?? raw.created_at,
  } as Program;
}

/**
 * Mapea respuesta del microservicio (camelCase) al tipo Subject
 */
function mapSubjectFromApi(raw: any): Subject {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code ?? null,
    is_active: raw.isActive ?? raw.is_active ?? true,
    credits: raw.credits ?? null,
    semester: raw.semester ?? null,
    created_at: raw.createdAt ?? raw.created_at,
  } as Subject;
}
