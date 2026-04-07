/**
 * Publication Type: Busco Equipo para Proyecto
 * 
 * Buscar compañeros para formar equipo en un proyecto específico
 * Campos específicos: materia, descripción del proyecto, skills requeridos, fechas
 */

import { Publication } from './Publication';

export interface ProjectTeamSpecificFields {
  subjectId: string;
  subjectName: string;
  projectName: string;
  requiredSkills: string[]; // ej: ["Python", "React", "Base de datos"]
  teamSize: number;
  currentMembers: number;
  deadline: Date;
}

export class ProjectTeamPublication extends Publication {
  private specificFields: ProjectTeamSpecificFields;

  constructor(
    id: string,
    title: string,
    description: string,
    authorId: string,
    specificFields: ProjectTeamSpecificFields
  ) {
    super(id, title, description, authorId);
    this.specificFields = specificFields;
  }

  /**
   * Validación específica para búsqueda de equipo de proyecto
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.length < 10) {
      errors.push('El título debe tener al menos 10 caracteres');
    }

    if (!this.description || this.description.length < 30) {
      errors.push('La descripción del proyecto debe tener al menos 30 caracteres');
    }

    if (!this.specificFields.projectName || this.specificFields.projectName.length < 5) {
      errors.push('El nombre del proyecto es requerido');
    }

    if (!this.specificFields.requiredSkills || this.specificFields.requiredSkills.length === 0) {
      errors.push('Debe especificar al menos una skill requerida');
    }

    if (this.specificFields.teamSize < 2) {
      errors.push('El tamaño del equipo mínimo es 2 miembros');
    }

    if (this.specificFields.currentMembers >= this.specificFields.teamSize) {
      errors.push('El equipo ya está completo');
    }

    if (!this.specificFields.deadline || new Date(this.specificFields.deadline) <= new Date()) {
      errors.push('La fecha límite debe ser en el futuro');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public getType(): string {
    return 'busco_equipo_proyecto';
  }

  public getSpecificFields(): ProjectTeamSpecificFields {
    return this.specificFields;
  }

  /**
   * Método específico: verificar si el equipo sigue aceptando miembros
   */
  public hasAvailableSlots(): boolean {
    return this.specificFields.currentMembers < this.specificFields.teamSize;
  }

  /**
   * Método específico: agregar miembro
   */
  public addMember(): boolean {
    if (this.hasAvailableSlots()) {
      this.specificFields.currentMembers++;
      this.metadata.updatedAt = new Date();
      return true;
    }
    return false;
  }
}

export default ProjectTeamPublication;
