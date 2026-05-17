export interface IPermissionValidator {
  canEditResource(resourceId: string, actorUserId: string): Promise<boolean>;
}
