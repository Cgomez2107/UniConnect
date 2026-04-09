/**
 * Publication Type: Busco Compañero de Estudio
 * 
 * Buscar estudiantes para estudiar juntos una materia específica
 * Campos específicos: materia, horarios disponibles, modalidad (presencial/virtual)
 */

import { Publication } from './Publication';

export interface StudyCompanionSpecificFields {
  subjectId: string;
  subjectName: string;
  availableSchedules: string[]; // ej: ["Lunes 2-4pm", "Miércoles 3-5pm"]
  modality: 'presencial' | 'virtual' | 'hibrida';
  maxMembers?: number;
}

export class StudyCompanionPublication extends Publication {
  private specificFields: StudyCompanionSpecificFields;

  constructor(
    id: string,
    title: string,
    description: string,
    authorId: string,
    specificFields: StudyCompanionSpecificFields
  ) {
    super(id, title, description, authorId);
    this.specificFields = specificFields;
  }

  /**
   * Validación específica para búsqueda de compañero
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.length < 10) {
      errors.push('El título debe tener al menos 10 caracteres');
    }

    if (!this.description || this.description.length < 20) {
      errors.push('La descripción debe tener al menos 20 caracteres');
    }

    if (!this.specificFields.subjectId) {
      errors.push('Debe seleccionar una materia');
    }

    if (!this.specificFields.availableSchedules || this.specificFields.availableSchedules.length === 0) {
      errors.push('Debe especificar al menos un horario disponible');
    }

    if (!this.specificFields.modality) {
      errors.push('Debe especificar la modalidad (presencial/virtual/híbrida)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public getType(): string {
    return 'busco_companero';
  }

  public getSpecificFields(): StudyCompanionSpecificFields {
    return this.specificFields;
  }
}

export default StudyCompanionPublication;
