import { Home, Search, ClipboardList, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { useAuth } from "../../hooks/useAuth";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search, end: false },
  { to: "/orders", label: "Orders", icon: ClipboardList, end: false },
  { to: "/account", label: "Account", icon: UserRound, end: false },
];

export function MobileNav() {
  const { user } = useAuth();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-warm-200 bg-white/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const target =
            (item.to === "/orders" || item.to === "/account") && !user
              ? "/login"
              : item.to;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={target}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition",
                  isActive && target === item.to
                    ? "text-tomato-600"
                    : "text-neutral-500",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
