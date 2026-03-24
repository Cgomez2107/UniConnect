import type { Event, EventStatus } from "../entities/Event.js";

/**
 * Contrato: acceso a datos de eventos
 * Solo admins pueden crear/editar/borrar
 * Cualquiera puede listar y ver detalles
 */
export interface IEventRepository {
  /**
   * Obtener todos los eventos activos, ordenados por fecha de inicio
   */
  getAllEvents(): Promise<Event[]>;

  /**
   * Obtener eventos futuros (startAt > ahora)
   */
  getUpcomingEvents(limit?: number): Promise<Event[]>;

  /**
   * Obtener evento por ID
   */
  getById(id: string): Promise<Event | null>;

  /**
   * Crear evento (solo admin)
   */
  create(input: {
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string;
    organizerId: string;
    maxCapacity?: number;
  }): Promise<Event>;

  /**
   * Actualizar evento (solo admin y solo si es propietario)
   */
  update(
    id: string,
    organizerId: string,
    input: {
      title?: string;
      description?: string;
      location?: string;
      startAt?: string;
      endAt?: string;
      maxCapacity?: number | null;
    },
  ): Promise<Event>;

  /**
   * Cambiar estado del evento
   */
  updateStatus(id: string, organizerId: string, status: EventStatus): Promise<void>;

  /**
   * Eliminar evento (solo admin y solo si es propietario)
   */
  delete(id: string, organizerId: string): Promise<void>;
}
