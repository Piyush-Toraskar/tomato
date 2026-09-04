import { CircleAlert, RotateCcw } from "lucide-react";
import { ApiError } from "../../api/client";
import { Button } from "./Button";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: ErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.detail
      : error instanceof Error
        ? error.message
        : "Please try again.";

  const requestId = error instanceof ApiError ? error.requestId : null;

  return (
    <div className="rounded-2xl border border-tomato-200 bg-tomato-50 p-5">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-tomato-600" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-700">{message}</p>
          {requestId ? (
            <p className="mt-2 break-all text-xs text-neutral-500">
              Request reference: {requestId}
            </p>
          ) : null}
          {onRetry ? (
            <Button
              className="mt-4"
              variant="secondary"
              size="sm"
              onClick={onRetry}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
