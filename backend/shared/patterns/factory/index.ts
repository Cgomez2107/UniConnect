/**
 * Exports del patrón Factory Method
 */

export { Publication, PublicationMetadata } from './Publication.js';
export { StudyCompanionPublication, StudyCompanionSpecificFields } from './StudyCompanionPublication.js';
export { ProjectTeamPublication, ProjectTeamSpecificFields } from './ProjectTeamPublication.js';
export { ResourcePublication, ResourcePublicationSpecificFields, ResourceType } from './ResourcePublication.js';
export { EventPublication, EventPublicationSpecificFields, EventCategory } from './EventPublication.js';
export { PublicationFactory, PublicationType, PublicationFactoryConfig } from './PublicationFactory.js';
