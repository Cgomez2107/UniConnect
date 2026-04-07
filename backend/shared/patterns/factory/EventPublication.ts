/**
 * Publication Type: Anuncio de Eventos
 * 
 * Anunciar eventos académicos (capacitaciones, conferencias, talleres, etc)
 * Campos específicos: fecha, ubicación, capacidad, categoría
 */

import { Publication } from './Publication';

export type EventCategory = 'taller' | 'conferencia' | 'capacitacion' | 'seminario' | 'networking' | 'competencia' | 'otro';

export interface EventPublicationSpecificFields {
  eventCategory: EventCategory;
  eventDate: Date;
  startTime: string; // ej: "14:30"
  endTime: string; // ej: "16:30"
  location: string;
  capacity: number;
  registeredCount: number;
  isFree: boolean;
  cost?: number; // si no es free
  prerequisites?: string;
}

export class EventPublication extends Publication {
  private specificFields: EventPublicationSpecificFields;

  constructor(
    id: string,
    title: string,
    description: string,
    authorId: string,
    specificFields: EventPublicationSpecificFields
  ) {
    super(id, title, description, authorId);
    this.specificFields = specificFields;
  }

  /**
   * Validación específica para evento
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.length < 10) {
      errors.push('El título debe tener al menos 10 caracteres');
    }

    if (!this.description || this.description.length < 20) {
      errors.push('La descripción debe tener al menos 20 caracteres');
    }

    if (!this.specificFields.eventCategory) {
      errors.push('Debe especificar la categoría del evento');
    }

    if (!this.specificFields.eventDate || new Date(this.specificFields.eventDate) <= new Date()) {
      errors.push('La fecha del evento debe ser en el futuro');
    }

    if (!this.specificFields.startTime || !this.isValidTime(this.specificFields.startTime)) {
      errors.push('Hora de inicio inválida (formato: HH:mm)');
    }

    if (!this.specificFields.endTime || !this.isValidTime(this.specificFields.endTime)) {
      errors.push('Hora de fin inválida (formato: HH:mm)');
    }

    if (!this.specificFields.location || this.specificFields.location.length < 5) {
      errors.push('Debe especificar la ubicación del evento');
    }

    if (this.specificFields.capacity < 1) {
      errors.push('La capacidad debe ser al menos 1 persona');
    }

    if (!this.specificFields.isFree && (!this.specificFields.cost || this.specificFields.cost <= 0)) {
      errors.push('Si el evento no es gratuito, debe especificar el costo');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validar formato de hora (HH:mm)
   */
  private isValidTime(time: string): boolean {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  public getType(): string {
    return 'evento';
  }

  public getSpecificFields(): EventPublicationSpecificFields {
    return this.specificFields;
  }

  /**
   * Método específico: verificar si hay cupos disponibles
   */
  public hasAvailableCapacity(): boolean {
    return this.specificFields.registeredCount < this.specificFields.capacity;
  }

  /**
   * Método específico: registrar asistente
   */
  public registerAttendee(): boolean {
    if (this.hasAvailableCapacity()) {
      this.specificFields.registeredCount++;
      this.metadata.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Método específico: calcular disponibilidad
   */
  public getAvailableSlots(): number {
    return this.specificFields.capacity - this.specificFields.registeredCount;
  }

  /**
   * Método específico: get resumen del evento
   */
  public getEventSummary(): string {
    const date = new Date(this.specificFields.eventDate).toLocaleDateString('es-ES');
    const time = `${this.specificFields.startTime} - ${this.specificFields.endTime}`;
    const slots = this.getAvailableSlots();
    return `${this.specificFields.eventCategory.toUpperCase()} - ${date} ${time} - Cupos disponibles: ${slots}/${this.specificFields.capacity}`;
  }
}

export default EventPublication;
