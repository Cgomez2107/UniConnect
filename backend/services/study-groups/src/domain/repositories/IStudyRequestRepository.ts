import type { StudyRequest } from "../entities/StudyRequest.js";

/**
 * Parámetros de filtrado para el feed de solicitudes abiertas.
 *
 * `subjectIds` permite filtrar por múltiples materias en una sola consulta
 * al servidor, evitando el antipatrón de filtrado en el cliente que rompe
 * la paginación al reducir el conjunto de resultados post-fetch.
 */
export interface ListOpenFilters {
  readonly subjectId?: string;
  readonly subjectIds?: string[];
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * Contrato de acceso a datos para solicitudes de estudio.
 * Las implementaciones concretas deciden el origen de datos
 * (Postgres, InMemory para tests, etc.) sin afectar la capa de aplicación.
 */
export interface IStudyRequestRepository {
  listOpen(filters?: ListOpenFilters): Promise<StudyRequest[]>;
  getById(id: string): Promise<StudyRequest | null>;
  create(input: {
    authorId: string;
    subjectId: string;
    title: string;
    description: string;
    maxMembers: number;
  }): Promise<StudyRequest>;
  countBySubject(subjectId: string): Promise<number>;
}