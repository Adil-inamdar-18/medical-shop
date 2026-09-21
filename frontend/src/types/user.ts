export type UserRole = "admin" | "user";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}
