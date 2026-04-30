import { SupabaseStudentRepository } from "./SupabaseStudentRepository";
import { fetchApi } from "@/lib/api/httpClient";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { StudentSearchResult, StudentPublicProfile } from "@/types";

/**
 * Repositorio de estudiantes que delega al microservicio profiles-catalog.
 */
export class ApiStudentRepository implements IStudentRepository {
    private readonly fallback = new SupabaseStudentRepository();

    async searchBySubject(
        subjectId: string,
        currentUserId: string,
        page = 0,
        pageSize = 20
    ): Promise<StudentSearchResult[]> {
        try {
            const params = new URLSearchParams({
                subjectId,
                page: (page + 1).toString(),
                limit: pageSize.toString()
            });
            if (currentUserId) {
                params.set("currentUserId", currentUserId);
            }

            const data = await fetchApi<any[]>(`/students?${params.toString()}`);
            return (data ?? []).map(mapStudentSearchResultFromApi);
        } catch (error) {
            return this.fallback.searchBySubject(subjectId, currentUserId, page, pageSize);
        }
    }

    async getPublicProfile(studentId: string, currentUserId: string): Promise<StudentPublicProfile | null> {
        try {
            const params = new URLSearchParams();
            if (currentUserId) {
                params.set("currentUserId", currentUserId);
            }
            const suffix = params.toString() ? `?${params.toString()}` : "";
            const data = await fetchApi<any>(`/students/${studentId}${suffix}`);
            return data ? mapStudentPublicProfileFromApi(data) : null;
        } catch (error) {
            return this.fallback.getPublicProfile(studentId, currentUserId);
        }
    }
}

function mapStudentSearchResultFromApi(raw: any): StudentSearchResult {
    return {
        id: raw.id,
        full_name: raw.fullName ?? raw.full_name,
        avatar_url: raw.avatarUrl ?? raw.avatar_url ?? null,
        bio: raw.bio ?? null,
        semester: raw.semester ?? null,
        program_name: raw.programName ?? raw.program_name ?? null,
        faculty_name: raw.facultyName ?? raw.faculty_name ?? null,
    };
}

function mapStudentPublicProfileFromApi(raw: any): StudentPublicProfile {
    return {
        id: raw.id,
        full_name: raw.fullName ?? raw.full_name,
        avatar_url: raw.avatarUrl ?? raw.avatar_url ?? null,
        bio: raw.bio ?? null,
        semester: raw.semester ?? null,
        program_name: raw.programName ?? raw.program_name ?? null,
        faculty_name: raw.facultyName ?? raw.faculty_name ?? null,
        shared_subjects: raw.sharedSubjects ?? raw.shared_subjects ?? [],
    };
}
