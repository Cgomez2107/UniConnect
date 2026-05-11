export interface IChatPermissionService {
  isUserBanned(userId: string, conversationId: string): Promise<boolean>;
  canWrite(userId: string, conversationId: string): Promise<boolean>;
}
