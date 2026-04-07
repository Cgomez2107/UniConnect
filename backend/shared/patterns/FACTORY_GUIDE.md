/**
 * FACTORY METHOD PATTERN - Guía de Implementación
 * 
 * ===============================================
 * ¿QUÉ ES FACTORY METHOD?
 * ===============================================
 * 
 * Es un patrón creacional que proporciona una interfaz para crear objetos,
 * pero permitiendo que las subclases decidan qué clase instanciar.
 * 
 * En UniConnect, usamos Factory Method para crear diferentes tipos de publicaciones
 * sin afectar el código existente cuando se agreguen nuevos tipos.
 * 
 * ===============================================
 * TIPOS DE PUBLICACIONES EN UNICONNECT
 * ===============================================
 * 
 * 1. STUDY COMPANION (Busco compañero)
 *    - Materia específica
 *    - Horarios disponibles
 *    - Modalidad: presencial/virtual/híbrida
 * 
 * 2. PROJECT TEAM (Busco equipo para proyecto)
 *    - Nombre y descripción del proyecto
 *    - Skills requeridos
 *    - Fecha límite
 *    - Control de miembros
 * 
 * 3. RESOURCE (Comparto recurso académico)
 *    - Tipo: apuntes, ejercicios, examen, etc
 *    - Archivo con límite de tamaño
 *    - Licencia Creative Commons
 *    - Contador de descargas
 * 
 * 4. EVENT (Anuncio de evento)
 *    - Categoría y fecha
 *    - Horario y ubicación
 *    - Capacidad y registros
 *    - Costo (opcional)
 * 
 * ===============================================
 * CÓMO USAR FACTORY METHOD
 * ===============================================
 * 
 * En Use Cases (Application Layer):
 * 
 * ```typescript
 * import { PublicationFactory } from '@uniconnect/shared/patterns/factory';
 * 
 * export class CreateStudyCompanionUseCase {
 *   async execute(dto: CreateStudyCompanionDto): Promise<void> {
 *     // Crear publicación usando factory
 *     const publication = PublicationFactory.create({
 *       id: uuid(),
 *       type: 'busco_companero',
 *       title: dto.title,
 *       description: dto.description,
 *       authorId: dto.userId,
 *       specificFields: {
 *         subjectId: dto.subjectId,
 *         subjectName: dto.subjectName,
 *         availableSchedules: dto.schedules,
 *         modality: dto.modality,
 *       },
 *     });
 * 
 *     // Validar
 *     const { valid, errors } = publication.validate();
 *     if (!valid) {
 *       throw new ValidationError(errors.join(', '));
 *     }
 * 
 *     // Publicar
 *     publication.publish();
 * 
 *     // Guardar en repositorio
 *     await this.publicationRepository.save(publication.toJSON());
 *   }
 * }
 * ```
 * 
 * ===============================================
 * VENTAJAS DE USAR FACTORY METHOD
 * ===============================================
 * 
 * ✅ OPEN/CLOSED PRINCIPLE
 *    - Abierto a extensión (nuevos tipos)
 *    - Cerrado a modificación (código existente no cambia)
 * 
 * ✅ ENCAPSULACION
 *    - Cada tipo encapsula su lógica de validación
 *    - Métodos específicos por tipo
 * 
 * ✅ FACIL DE TESTEAR
 *    - Cada tipo se prueba independientemente
 *    - Mock fácil del factory
 * 
 * ✅ SINGLE RESPONSIBILITY
 *    - Cada clase tiene una única responsabilidad
 * 
 * ===============================================
 * AGREGAR UN NUEVO TIPO
 * ===============================================
 * 
 * Si quieres agregar \"Oferta de tutoría\" sin tocar el código existente:
 * 
 * 1. Crear clase TutorshipPublication extends Publication
 * 2. Implementar validate() y getSpecificFields()
 * 3. Agregar caso en PublicationFactory.create()
 * 4. Agregar tipo en PublicationType union
 * 5. ¡LISTO! El resto del código sigue igual
 * 
 * ```typescript
 * // 1. Nueva clase
 * export class TutorshipPublication extends Publication {
 *   // implementación específica
 * }
 * 
 * // 2. Actualizar types
 * export type PublicationType = 'busco_companero' | ... | 'tutoria';
 * 
 * // 3. Actualizar factory
 * case 'tutoria':
 *   return new TutorshipPublication(...);
 * ```
 * 
 * ===============================================
 * ESTRUCTURA DE CARPETAS
 * ===============================================
 * 
 * /backend/shared/patterns/factory/
 * ├── Publication.ts                    (clase abstracta)
 * ├── StudyCompanionPublication.ts     (tipo: busco_companero)
 * ├── ProjectTeamPublication.ts        (tipo: busco_equipo_proyecto)
 * ├── ResourcePublication.ts           (tipo: recurso)
 * ├── EventPublication.ts              (tipo: evento)
 * ├── PublicationFactory.ts           (factory)
 * └── index.ts                         (exports)
 * 
 * ===============================================
 * CHECKLIST DE IMPLEMENTACIÓN
 * ===============================================
 * 
 * [ ] Importar PublicationFactory en DTOs de entrada
 * [ ] Crear publicación con factory en Use Cases
 * [ ] Guardar resultado de toJSON() en BD
 * [ ] Recuperar y reconstruir publicación desde BD
 * [ ] Tests unitarios para cada tipo
 * [ ] Tests de validación específica de cada tipo
 * [ ] Documentar nuevos tipos en FACTORY_GUIDE.md
 * 
 */

export const FACTORY_METHOD_GUIDE = true;
