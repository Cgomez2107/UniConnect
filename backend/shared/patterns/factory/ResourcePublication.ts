/**
 * Publication Type: Comparto Recurso
 * 
 * Compartir material académico (apuntes, ejercicios, resúmenes, etc)
 * Campos específicos: tipo de recurso, materia, archivo, licencia
 */

import { Publication } from './Publication';

export type ResourceType = 'apuntes' | 'ejercicios' | 'resumen' | 'examen' | 'presentacion' | 'libro' | 'otro';

export interface ResourcePublicationSpecificFields {
  resourceType: ResourceType;
  subjectId: string;
  subjectName: string;
  fileUrl: string;
  fileSize: number; // en bytes
  license: 'cc-by' | 'cc-by-sa' | 'cc-by-nd' | 'cc-by-nc' | 'cc-by-nc-sa'; // Creative Commons
  tags: string[];
  downloads: number;
}

export class ResourcePublication extends Publication {
  private specificFields: ResourcePublicationSpecificFields;

  constructor(
    id: string,
    title: string,
    description: string,
    authorId: string,
    specificFields: ResourcePublicationSpecificFields
  ) {
    super(id, title, description, authorId);
    this.specificFields = specificFields;
  }

  /**
   * Validación específica para recurso compartido
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.length < 5) {
      errors.push('El título debe tener al menos 5 caracteres');
    }

    if (!this.description || this.description.length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    if (!this.specificFields.resourceType) {
      errors.push('Debe especificar el tipo de recurso');
    }

    if (!this.specificFields.subjectId) {
      errors.push('Debe seleccionar una materia');
    }

    if (!this.specificFields.fileUrl) {
      errors.push('Debe proporcionar un archivo');
    }

    if (this.specificFields.fileSize > 100 * 1024 * 1024) {
      // 100MB max
      errors.push('El archivo no puede exceder 100MB');
    }

    if (!this.specificFields.license) {
      errors.push('Debe seleccionar una licencia Creative Commons');
    }

    if (!this.specificFields.tags || this.specificFields.tags.length === 0) {
      errors.push('Debe agregar al menos una etiqueta');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public getType(): string {
    return 'recurso';
  }

  public getSpecificFields(): ResourcePublicationSpecificFields {
    return this.specificFields;
  }

  /**
   * Método específico: incrementar descargas
   */
  public incrementDownloads(): void {
    this.specificFields.downloads++;
    this.metadata.updatedAt = new Date();
  }

  /**
   * Método específico: get resumen del recurso
   */
  public getSummary(): string {
    return `${this.specificFields.resourceType.toUpperCase()} - ${this.specificFields.subjectName} - Descargas: ${this.specificFields.downloads}`;
  }
}

export default ResourcePublication;
