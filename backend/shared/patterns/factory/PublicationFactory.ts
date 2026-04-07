/**
 * PublicationFactory - Factory Method Pattern
 * 
 * Crea instancias de diferentes tipos de publicaciones según el tipo solicitado.
 * Cada tipo tiene su propia lógica de validación, campos específicos y comportamiento.
 * 
 * Ventajas:
 * ✅ Agregar un nuevo tipo de publicación no afecta el código existente
 * ✅ Cada tipo encapsula su propia lógica
 * ✅ Cliente solo llama a un método factory
 * ✅ Facil de testear cada tipo por separado
 */

import { Publication } from './Publication';
import { StudyCompanionPublication, StudyCompanionSpecificFields } from './StudyCompanionPublication';
import { ProjectTeamPublication, ProjectTeamSpecificFields } from './ProjectTeamPublication';
import { ResourcePublication, ResourcePublicationSpecificFields } from './ResourcePublication';
import { EventPublication, EventPublicationSpecificFields } from './EventPublication';

export type PublicationType = 'busco_companero' | 'busco_equipo_proyecto' | 'recurso' | 'evento';

export interface PublicationFactoryConfig {
  id: string;
  title: string;
  description: string;
  authorId: string;
  type: PublicationType;
  specificFields: any;
}

export class PublicationFactory {
  /**
   * Crear una publicación basada en el tipo
   * 
   * @param config Configuración de la publicación
   * @returns Instancia de Publication del tipo correspondiente
   * @throws Error si el tipo no es válido
   */
  public static create(config: PublicationFactoryConfig): Publication {
    switch (config.type) {
      case 'busco_companero':
        return new StudyCompanionPublication(
          config.id,
          config.title,
          config.description,
          config.authorId,
          config.specificFields as StudyCompanionSpecificFields
        );

      case 'busco_equipo_proyecto':
        return new ProjectTeamPublication(
          config.id,
          config.title,
          config.description,
          config.authorId,
          config.specificFields as ProjectTeamSpecificFields
        );

      case 'recurso':
        return new ResourcePublication(
          config.id,
          config.title,
          config.description,
          config.authorId,
          config.specificFields as ResourcePublicationSpecificFields
        );

      case 'evento':
        return new EventPublication(
          config.id,
          config.title,
          config.description,
          config.authorId,
          config.specificFields as EventPublicationSpecificFields
        );

      default:
        throw new Error(`Tipo de publicación no válido: ${config.type}`);
    }
  }

  /**
   * Get tipos de publicación disponibles
   */
  public static getAvailableTypes(): PublicationType[] {
    return ['busco_companero', 'busco_equipo_proyecto', 'recurso', 'evento'];
  }

  /**
   * Get descripción de un tipo de publicación
   */
  public static getTypeDescription(type: PublicationType): string {
    const descriptions: Record<PublicationType, string> = {
      busco_companero: 'Busco un compañero para estudiar una materia',
      busco_equipo_proyecto: 'Busco compañeros para formar un equipo de proyecto',
      recurso: 'Comparto material académico (apuntes, ejercicios, etc)',
      evento: 'Anuncio de un evento académico',
    };
    return descriptions[type] || 'Tipo desconocido';
  }

  /**
   * Get esquema de campos requeridos para cada tipo
   */
  public static getRequiredFieldsSchema(type: PublicationType): Record<string, any> {
    const schemas: Record<PublicationType, Record<string, any>> = {
      busco_companero: {
        subjectId: 'string',
        subjectName: 'string',
        availableSchedules: 'string[]',
        modality: 'presencial|virtual|hibrida',
      },
      busco_equipo_proyecto: {
        projectName: 'string',
        requiredSkills: 'string[]',
        teamSize: 'number',
        currentMembers: 'number',
        deadline: 'ISO 8601 date',
      },
      recurso: {
        resourceType: 'apuntes|ejercicios|resumen|examen|presentacion|libro|otro',
        subjectId: 'string',
        subjectName: 'string',
        fileUrl: 'string',
        fileSize: 'number (bytes)',
        license: 'cc-by|cc-by-sa|cc-by-nd|cc-by-nc|cc-by-nc-sa',
        tags: 'string[]',
      },
      evento: {
        eventCategory: 'taller|conferencia|capacitacion|seminario|networking|competencia|otro',
        eventDate: 'ISO 8601 date',
        startTime: 'HH:mm',
        endTime: 'HH:mm',
        location: 'string',
        capacity: 'number',
        isFree: 'boolean',
        cost: 'number (si isFree=false)',
      },
    };
    return schemas[type] || {};
  }
}

export default PublicationFactory;
