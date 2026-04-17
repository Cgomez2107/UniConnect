export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: "estudiante" | "moderador" | "admin";
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
