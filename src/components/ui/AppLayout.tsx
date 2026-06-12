// fixed
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import logoUrl from "@/assets/belton-logo.png";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/form", label: "บันทึกพารามิเตอร์ (Technician)" },
  { to: "/records", label: "ประวัติ / Export" },
  { to: "/master", label: "Master Conditions" },
];

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const { location } = useRouterState();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-6 flex-wrap">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src={logoUrl} alt="Belton Technology" className="h-10 w-auto" />
            <div className="hidden md:block leading-tight">
              <div className="text-xs text-muted-foreground">Molding Parameter Record</div>
              <div className="text-sm font-semibold">ใบบันทึกพารามิเตอร์การฉีด</div>
            </div>
          </Link>
          <nav className="flex gap-1 ml-auto flex-wrap">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6">
        {children ?? <Outlet />}
      </main>
      <footer className="border-t bg-card py-3 text-center text-xs text-muted-foreground">
        © Belton Technology — Injection Molding Condition System
      </footer>
    </div>
  );
}
