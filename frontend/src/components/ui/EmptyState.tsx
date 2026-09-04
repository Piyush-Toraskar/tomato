import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-16 text-center">
      {icon ? (
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-warm-100 text-warm-700">
          {icon}
        </div>
      ) : null}
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
