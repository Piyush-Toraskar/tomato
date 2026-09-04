import {
  apiRequest,
  clearSessionTokens,
  setSessionTokens,
} from "./client";
import type {
  AuthUser,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from "../types/auth";

export async function registerAccount(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginAccount(
  payload: LoginRequest,
): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
  setSessionTokens(tokens);
  return tokens;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", {
    auth: true,
  });
}

export async function logoutCurrentDevice(): Promise<MessageResponse> {
  try {
    return await apiRequest<MessageResponse>("/auth/logout", {
      method: "POST",
      auth: true,
      retryOnAuthFailure: false,
    });
  } finally {
    clearSessionTokens();
  }
}

export async function logoutEveryDevice(): Promise<MessageResponse> {
  try {
    return await apiRequest<MessageResponse>("/auth/logout-all", {
      method: "POST",
      auth: true,
      retryOnAuthFailure: false,
    });
  } finally {
    clearSessionTokens();
  }
}

export async function requestEmailVerification(): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/request-email-verification", {
    method: "POST",
    auth: true,
  });
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: {
      token,
      new_password: newPassword,
    },
  });
}
