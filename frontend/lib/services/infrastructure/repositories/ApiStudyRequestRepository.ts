import { SupabaseStudyRequestRepository } from "./SupabaseStudyRequestRepository";
import { fetchApi } from "@/lib/api/httpClient";
import type {
    IStudyRequestRepository,
    UserSubjectCatalogItem,
    RequestAdminEntry,
} from "../../domain/repositories/IStudyRequestRepository";
import type { StudyRequest } from "@/types";

/**
 * Repositorio de solicitudes de estudio que delega al microservicio study-groups
 * vía el API Gateway.
 *
 * Aplica el patrón Adapter: traduce la interfaz del dominio del frontend
 * (snake_case, campos de Supabase) a los contratos del microservicio (camelCase).
 *
 * Las operaciones que aún no han sido migradas al backend delegan al repositorio
 * de Supabase como fallback. Esto permite una migración incremental por vertical
 * sin romper el flujo de la aplicación en ningún momento.
 *
 * Punto de migración: cuando el backend implemente un endpoint, se elimina
 * el método fallback correspondiente y se reemplaza por `fetchApi`.
 */
export class ApiStudyRequestRepository implements IStudyRequestRepository {
    private readonly fallback = new SupabaseStudyRequestRepository();

    async getFeed(
        filters?: { subjectIds?: string[]; subject_id?: string; search?: string },
        page = 0,
        pageSize = 10,
    ): Promise<StudyRequest[]> {
        const params = new URLSearchParams();

        if (filters?.subjectIds && filters.subjectIds.length > 0) {
            params.set("subjectIds", filters.subjectIds.join(","));
        } else if (filters?.subject_id) {
            params.set("subjectId", filters.subject_id);
        }

        if (filters?.search) params.set("search", filters.search);

        params.set("page", (page + 1).toString());
        params.set("limit", pageSize.toString());

        const data = await fetchApi<StudyRequest[]>(
            `/study-groups?${params.toString()}`,
        );

        return (data ?? []).map(mapStudyRequestFromApi);
    }

    async getById(id: string): Promise<StudyRequest | null> {
        try {
            const data = await fetchApi<StudyRequest>(`/study-groups/${id}`);
            return data ? mapStudyRequestFromApi(data) : null;
        } catch (error) {
            if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
                return null;
            }
            throw error;
        }
    }

    async create(
        _userId: string,
        payload: {
            title: string;
            description: string;
            subject_id: string;
            max_members: number;
        },
    ): Promise<StudyRequest> {
        const data = await fetchApi<StudyRequest>("/study-groups", {
            method: "POST",
            body: JSON.stringify({
                subjectId: payload.subject_id,
                title: payload.title,
                description: payload.description,
                maxMembers: payload.max_members,
            }),
        });

        return mapStudyRequestFromApi(data);
    }

    // Operaciones pendientes de migración al backend — delegan a Supabase
    async getByAuthor(userId: string): Promise<StudyRequest[]> {
        return this.fallback.getByAuthor(userId);
    }

    async getEnrolledSubjects(userId: string): Promise<UserSubjectCatalogItem[]> {
        return this.fallback.getEnrolledSubjects(userId);
    }

    async getAvailableSubjectsForUser(userId: string): Promise<UserSubjectCatalogItem[]> {
        return this.fallback.getAvailableSubjectsForUser(userId);
    }

    async updateStatus(
        requestId: string,
        status: "abierta" | "cerrada" | "expirada",
    ): Promise<void> {
        return this.fallback.updateStatus(requestId, status);
    }

    async updateContent(
        requestId: string,
        userId: string,
        payload: { title?: string; description?: string },
    ): Promise<void> {
        return this.fallback.updateContent(requestId, userId, payload);
    }

    async cancel(requestId: string, userId: string): Promise<void> {
        return this.fallback.cancel(requestId, userId);
    }

    async isAdmin(requestId: string, userId: string): Promise<boolean> {
        return this.fallback.isAdmin(requestId, userId);
    }

    async getAdmins(requestId: string): Promise<RequestAdminEntry[]> {
        return this.fallback.getAdmins(requestId);
    }

    async assignAdmin(
        requestId: string,
        targetUserId: string,
        actorUserId: string,
    ): Promise<void> {
        return this.fallback.assignAdmin(requestId, targetUserId, actorUserId);
    }

    async revokeAdmin(
        requestId: string,
        targetUserId: string,
        actorUserId: string,
    ): Promise<void> {
        return this.fallback.revokeAdmin(requestId, targetUserId, actorUserId);
    }

    async countBySubject(subjectId: string): Promise<number> {
        return this.fallback.countBySubject(subjectId);
    }
}

/**
 * Traduce la respuesta del microservicio (camelCase) al tipo StudyRequest
 * que espera el frontend (snake_case con campos de Supabase).
 *
 * Centralizar este mapeo aquí garantiza que ningún cambio en el contrato
 * del backend afecte a hooks ni pantallas.
 */
function mapStudyRequestFromApi(raw: any): StudyRequest {
    const subjectName = raw.subjectName ?? raw.subject_name;
    return {
        id: raw.id,
        author_id: raw.authorId ?? raw.author_id,
        subject_id: raw.subjectId ?? raw.subject_id,
        title: raw.title,
        description: raw.description,
        max_members: raw.maxMembers ?? raw.max_members,
        status: raw.status,
        is_active: raw.isActive ?? raw.is_active,
        created_at: raw.createdAt ?? raw.created_at,
        updated_at: raw.updatedAt ?? raw.updated_at,
        subject_name: subjectName,
        faculty_name: raw.facultyName ?? raw.faculty_name,
        applications_count: raw.applicationsCount ?? raw.applications_count,
        subjects: subjectName ? { name: subjectName } : undefined,
        profiles: raw.author
            ? {
                full_name: raw.author.fullName,
                avatar_url: raw.author.avatarUrl ?? null,
                bio: raw.author.bio ?? null,
            }
            : undefined,
    } as StudyRequest;
}