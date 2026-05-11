export interface IUserExistenceService {
  allUsersExist(userIds: string[]): Promise<boolean>;
}
