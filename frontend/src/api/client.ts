import type { ApiErrorBody, ValidationIssue } from "../types/api";
import type { TokenResponse } from "../types/auth";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredBaseUrl || "").replace(/\/$/, "");

const REFRESH_TOKEN_KEY = "tomato.refresh-token";
const SESSION_EXPIRED_EVENT = "tomato:session-expired";

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly validationIssues: ValidationIssue[];
  readonly requestId: string | null;
  readonly retryAfter: number | null;

  constructor(options: {
    status: number;
    detail: string;
    validationIssues?: ValidationIssue[];
    requestId?: string | null;
    retryAfter?: number | null;
  }) {
    super(options.detail);
    this.name = "ApiError";
    this.status = options.status;
    this.detail = options.detail;
    this.validationIssues = options.validationIssues ?? [];
    this.requestId = options.requestId ?? null;
    this.retryAfter = options.retryAfter ?? null;
  }
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  retryOnAuthFailure?: boolean;
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasStoredRefreshToken(): boolean {
  return Boolean(getStoredRefreshToken());
}

export function setSessionTokens(tokens: TokenResponse): void {
  accessToken = tokens.access_token;
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearSessionTokens(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return accessToken;
}

function dispatchSessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

export function onSessionExpired(listener: () => void): () => void {
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function detailFromBody(body: unknown, status: number): {
  detail: string;
  validationIssues: ValidationIssue[];
  requestId: string | null;
} {
  if (typeof body === "string" && body.trim()) {
    return {
      detail: body,
      validationIssues: [],
      requestId: null,
    };
  }

  if (typeof body === "object" && body !== null) {
    const errorBody = body as ApiErrorBody;
    const validationIssues = Array.isArray(errorBody.detail)
      ? errorBody.detail
      : [];

    if (typeof errorBody.detail === "string") {
      return {
        detail: errorBody.detail,
        validationIssues,
        requestId: errorBody.request_id ?? null,
      };
    }

    if (validationIssues.length > 0) {
      return {
        detail: "Please check the highlighted fields.",
        validationIssues,
        requestId: errorBody.request_id ?? null,
      };
    }
  }

  return {
    detail: status >= 500 ? "Something went wrong on our end." : "Request failed.",
    validationIssues: [],
    requestId: null,
  };
}

function friendlyErrorMessage(status: number, serverDetail: string): string {
  if (status === 0) {
    return "We could not connect to the server.";
  }

  if (status === 401) {
    if (serverDetail.toLowerCase().includes("password")) {
      return "Incorrect email or password.";
    }
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "We could not find that.";
  }

  if (status === 409) {
    return serverDetail || "This action conflicts with the current state.";
  }

  if (status === 422) {
    return "Please check the highlighted fields.";
  }

  if (status === 429) {
    return "You are moving a little fast. Try again shortly.";
  }

  if (status >= 500) {
    return "Something went wrong on our end.";
  }

  return serverDetail || "Request failed.";
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return false;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": createRequestId(),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const body = await parseResponseBody(response);
      if (!response.ok) {
        clearSessionTokens();
        dispatchSessionExpired();
        return false;
      }

      setSessionTokens(body as TokenResponse);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function restoreStoredSession(): Promise<boolean> {
  return refreshSession();
}

async function performRequest<T>(
  path: string,
  options: ApiRequestOptions,
  attemptedRefresh: boolean,
): Promise<T> {
  const auth = options.auth ?? false;

  if (auth && !accessToken && hasStoredRefreshToken() && !attemptedRefresh) {
    await refreshSession();
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Request-ID", createRequestId());

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body:
        options.body === undefined
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError({
      status: 0,
      detail: friendlyErrorMessage(0, ""),
    });
  }

  if (
    response.status === 401 &&
    auth &&
    !attemptedRefresh &&
    options.retryOnAuthFailure !== false &&
    hasStoredRefreshToken()
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return performRequest<T>(path, options, true);
    }
  }

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const parsed = detailFromBody(body, response.status);
    throw new ApiError({
      status: response.status,
      detail: friendlyErrorMessage(response.status, parsed.detail),
      validationIssues: parsed.validationIssues,
      requestId: response.headers.get("X-Request-ID") ?? parsed.requestId,
      retryAfter: Number(response.headers.get("Retry-After")) || null,
    });
  }

  return body as T;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return performRequest<T>(path, options, false);
}
