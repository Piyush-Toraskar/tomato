import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-warm-200 bg-white">
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-8 text-sm text-neutral-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Logo />
        <p>© {new Date().getFullYear()} Tomato. Food ordering, kept straightforward.</p>
      </div>
    </footer>
  );
}
