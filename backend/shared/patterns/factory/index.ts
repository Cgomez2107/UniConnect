/**
 * Exports del patrón Factory Method
 */

export { Publication, PublicationMetadata } from './Publication';
export { StudyCompanionPublication, StudyCompanionSpecificFields } from './StudyCompanionPublication';
export { ProjectTeamPublication, ProjectTeamSpecificFields, ProjectTeamSpecificFields as ProjectTeamSpecificFields } from './ProjectTeamPublication';
export { ResourcePublication, ResourcePublicationSpecificFields, ResourceType } from './ResourcePublication';
export { EventPublication, EventPublicationSpecificFields, EventCategory } from './EventPublication';
export { PublicationFactory, PublicationType, PublicationFactoryConfig } from './PublicationFactory';
