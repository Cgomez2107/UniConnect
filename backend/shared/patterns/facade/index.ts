/**
 * Exports del patrón Facade
 */

export {
  RegistrationFacade,
  RegistrationInput,
  RegistrationOutput,
  IUserService,
  IEmailService,
  IProfileService,
  IConfigurationService,
} from './RegistrationFacade';

export {
  StudyGroupFacade,
  CreateStudyGroupInput,
  CreateStudyGroupOutput,
  IStudyGroupRepository,
  IGroupMembershipService,
  IGroupConfigService,
  INotificationService,
} from './StudyGroupFacade';
