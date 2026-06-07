export interface ContactInfo {
  email?: string;
  pushToken?: string;
}

export interface IUserRepository {
  getContactInfo(userId: string): Promise<ContactInfo>;
  getFullName(userId: string): Promise<string | null>;
}
