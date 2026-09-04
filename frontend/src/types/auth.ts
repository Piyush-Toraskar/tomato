export type UserRole = "CUSTOMER" | "RESTAURANT" | "DRIVER";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
  debug_verification_token?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer" | string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
}

export interface MessageResponse {
  message: string;
  debug_token?: string | null;
}
