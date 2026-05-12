export interface ContactInfo {
  email?: string;
  pushToken?: string;
}

export interface IUserRepository {
  getContactInfo(userId: string): Promise<ContactInfo>;
}
