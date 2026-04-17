import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type {
  IStudyRequestRepository,
  ListOpenFilters,
} from "../../domain/repositories/IStudyRequestRepository.js";

/**
 * Parámetros de entrada para el caso de uso de listado del feed.
 * Refleja la interfaz pública que expone el controlador HTTP.
 */
export interface ListOpenStudyRequestsInput {
  readonly subjectId?: string;
  readonly subjectIds?: string[];
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * Caso de uso: obtener el feed de solicitudes de estudio abiertas.
 *
 * Centraliza las reglas de negocio de listado; el repositorio recibe
 * los filtros normalizados y decide la estrategia de consulta concreta.
 * Las restricciones adicionales de visibilidad o negocio deben agregarse
 * aquí antes de delegar al repositorio.
 */
export class ListOpenStudyRequests {
  constructor(private readonly repository: IStudyRequestRepository) { }

  async execute(input: ListOpenStudyRequestsInput = {}): Promise<StudyRequest[]> {
    const filters: ListOpenFilters = {
      subjectId: input.subjectId,
      subjectIds: input.subjectIds && input.subjectIds.length > 0
        ? input.subjectIds
        : undefined,
      search: input.search?.trim() || undefined,
      page: input.page,
      pageSize: input.pageSize,
    };

    return this.repository.listOpen(filters);
  }
}