import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Search, ShoppingBag, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { cn } from "../../lib/cn";

export function Header() {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === "/search") {
      setQuery(params.get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const workspacePath =
    user?.role === "RESTAURANT"
      ? "/restaurant/manage"
      : user?.role === "DRIVER"
        ? "/driver/manage"
        : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-canvas/95 backdrop-blur-md transition",
        scrolled ? "border-warm-200 shadow-sm" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-page items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <form
          onSubmit={submitSearch}
          className="relative ml-2 hidden min-w-0 flex-1 md:block lg:ml-8"
          role="search"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <label htmlFor="header-search" className="sr-only">
            Search restaurants
          </label>
          <input
            id="header-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurants or cuisines"
            className="h-11 w-full rounded-xl border border-warm-200 bg-white pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-tomato-500 focus:ring-4 focus:ring-tomato-100"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {workspacePath ? (
            <NavLink
              to={workspacePath}
              className={({ isActive }) =>
                cn(
                  "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition hover:bg-warm-100",
                  isActive ? "text-tomato-600" : "text-ink",
                )
              }
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Workspace
            </NavLink>
          ) : null}

          {user ? (
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                cn(
                  "inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium transition hover:bg-warm-100",
                  isActive ? "text-tomato-600" : "text-ink",
                )
              }
            >
              Orders
            </NavLink>
          ) : null}

          <NavLink
            to={user ? "/account" : "/login"}
            className={({ isActive }) =>
              cn(
                "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition hover:bg-warm-100",
                isActive ? "text-tomato-600" : "text-ink",
              )
            }
          >
            <UserRound className="h-4 w-4" />
            {user ? "Account" : "Sign in"}
          </NavLink>

          {(!user || user.role === "CUSTOMER") && (
            <Link
              to="/basket"
              className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-warm-200 bg-white px-3 text-sm font-semibold text-ink transition hover:border-warm-300 hover:bg-warm-50"
            >
              <ShoppingBag className="h-4 w-4" />
              Basket
              {itemCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-tomato-500 px-1 text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          )}
        </nav>

      </div>
    </header>
  );
}
