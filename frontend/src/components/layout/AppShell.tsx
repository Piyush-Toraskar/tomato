import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { BasketBar } from "../cart/BasketBar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main className="min-h-[calc(100vh-8rem)] pb-28 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BasketBar />
      <MobileNav />
    </div>
  );
}
