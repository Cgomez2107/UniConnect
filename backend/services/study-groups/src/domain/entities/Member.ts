export type MemberRole = "autor" | "admin" | "miembro";

export interface Member {
  readonly userId: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly role: MemberRole;
  readonly joinedAt: string | null;
}
