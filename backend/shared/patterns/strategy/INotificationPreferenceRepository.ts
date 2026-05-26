export interface INotificationPreferenceRepository {
  isChannelEnabled(userId: string, canal: string): Promise<boolean>;
}
