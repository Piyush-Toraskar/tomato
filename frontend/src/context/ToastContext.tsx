import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "../lib/cn";

type ToastTone = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: ReactNode;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = createToastId();
      const item: ToastItem = {
        ...toast,
        id,
        tone: toast.tone ?? "info",
      };

      setToasts((current) => [...current.slice(-3), item]);
      window.setTimeout(() => dismissToast(id), toast.duration ?? 4200);
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:right-5 sm:w-[380px]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.tone === "success"
              ? CheckCircle2
              : toast.tone === "error"
                ? CircleAlert
                : Info;

          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto w-full animate-toastIn rounded-xl border border-warm-200 bg-white p-4 shadow-lift"
            >
              <div className="flex items-start gap-3">
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    toast.tone === "success" && "text-emerald-700",
                    toast.tone === "error" && "text-tomato-600",
                    toast.tone === "info" && "text-warm-700",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm leading-5 text-neutral-600">
                      {toast.description}
                    </p>
                  ) : null}
                  {toast.action ? <div className="mt-3">{toast.action}</div> : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition hover:bg-warm-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
