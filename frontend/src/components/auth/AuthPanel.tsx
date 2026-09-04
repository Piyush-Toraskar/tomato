import type { PropsWithChildren, ReactNode } from "react";
import { Logo } from "../layout/Logo";

export function AuthPanel({
  title,
  description,
  children,
  footer,
}: PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
}>) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-page place-items-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 border-t border-warm-100 pt-5 text-center text-sm text-neutral-600">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}
