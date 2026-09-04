import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../../lib/cn";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      hint,
      leadingIcon,
      className,
      id,
      ...props
    },
    ref,
  ) {
    const inputId = id ?? props.name;

    const messageId = inputId
      ? `${inputId}-message`
      : undefined;

    return (
      <label
        className="block"
        htmlFor={inputId}
      >
        <span className="mb-2 block text-sm font-medium text-ink">
          {label}
        </span>

        <span className="relative block">
          {leadingIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-500">
              {leadingIcon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={messageId}
            className={cn(
              "h-11 w-full rounded-xl border bg-white px-3 text-[15px] text-ink outline-none transition placeholder:text-neutral-400 focus:border-tomato-500 focus:ring-4 focus:ring-tomato-100 disabled:cursor-not-allowed disabled:bg-warm-50",
              Boolean(leadingIcon) && "pl-10",
              error
                ? "border-tomato-500"
                : "border-warm-200",
              className,
            )}
            {...props}
          />
        </span>

        {error || hint ? (
          <span
            id={messageId}
            className={cn(
              "mt-1.5 block text-xs leading-5",
              error
                ? "text-tomato-700"
                : "text-neutral-500",
            )}
          >
            {error ?? hint}
          </span>
        ) : null}
      </label>
    );
  },
);