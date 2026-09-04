export interface ValidationIssue {
  type?: string;
  loc?: Array<string | number>;
  msg?: string;
  input?: unknown;
}

export interface ApiErrorBody {
  detail?: string | ValidationIssue[];
  request_id?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
