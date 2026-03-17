import { SupabaseApplicationRepository } from "./SupabaseApplicationRepository";
import { fetchApi } from "@/lib/api/httpClient";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository";
import type { Application } from "@/types";

/**
 * Repositorio de postulaciones que delega al microservicio study-groups
 * vía el API Gateway.
 *
 * Aplica el patrón Adapter: traduce la interfaz del dominio del frontend
 * a los contratos del microservicio.
 *
 * Las operaciones de lectura periférica (postulaciones del postulante,
 * estado de postulación, cancelación) aún no están en el microservicio
 * y delegan al repositorio de Supabase como fallback controlado.
 */
export class ApiApplicationRepository implements IApplicationRepository {
    private readonly fallback = new SupabaseApplicationRepository();

    async getByRequest(requestId: string): Promise<Application[]> {
        const data = await fetchApi<Application[]>(
            `/study-groups/${requestId}/applications`,
        );
        return data ?? [];
    }

    async create(
        requestId: string,
        _applicantId: string,
        message: string,
    ): Promise<Application> {
        const data = await fetchApi<Application>(
            `/study-groups/${requestId}/apply`,
            {
                method: "POST",
                body: JSON.stringify({ message }),
            },
        );
        return data;
    }

    async update(
        applicationId: string,
        status: "pendiente" | "aceptada" | "rechazada",
    ): Promise<void> {
        await fetchApi(
            `/study-groups/applications/${applicationId}/review`,
            {
                method: "PUT",
                body: JSON.stringify({ status }),
            },
        );
    }

    // Operaciones pendientes de migración al backend — delegan a Supabase
    async getById(id: string): Promise<Application | null> {
        return this.fallback.getById(id);
    }

    async getByApplicant(applicantId: string): Promise<Application[]> {
        return this.fallback.getByApplicant(applicantId);
    }

    async delete(id: string): Promise<void> {
        return this.fallback.delete(id);
    }

    async getReceivedByAuthor(authorId: string): Promise<Application[]> {
        return this.fallback.getReceivedByAuthor(authorId);
    }

    async getMyApplicationStatus(
        requestId: string,
        userId: string,
    ): Promise<"pendiente" | "aceptada" | "rechazada" | null> {
        return this.fallback.getMyApplicationStatus(requestId, userId);
    }

    async cancel(requestId: string, userId: string): Promise<void> {
        return this.fallback.cancel(requestId, userId);
    }
}