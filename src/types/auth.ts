export type RoleName = "admin" | "developer" | "moderator" | "user";

export type AuthUser = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  permissions: String[];
  role: RoleName;
  status: "active" | "inactive" | "invited" | "unverified";
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  expiresAt?: string;
  user: AuthUser | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};
