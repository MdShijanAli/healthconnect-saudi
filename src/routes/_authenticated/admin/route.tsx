import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  HeartPulse,
  LayoutDashboard,
  ListTree,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { dashboardForRole } from "@/lib/portal-navigation";
import { usePortalContext } from "@/components/portal-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/doctors/pending", label: "Approval Queue", icon: ClipboardCheck },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/admin/patients", label: "Patients", icon: Users },
  { to: "/admin/specializations", label: "Specializations", icon: ListTree },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: portal, isPending, error } = usePortalContext();

  useEffect(() => {
    if (portal && portal.role !== "super_admin") {
      navigate({ to: dashboardForRole(portal.role), replace: true });
    }
  }, [portal, navigate]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight">Sehaty Cloud</span>
          </Link>
          <div className="flex items-center gap-3">
            {portal ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-semibold sm:inline">{portal.fullName}</span>
                <Badge variant="secondary" className="rounded-full">
                  Super Admin
                </Badge>
              </div>
            ) : null}
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] items-start gap-6 px-4 py-8">
        <aside className="sticky top-[73px] hidden w-60 shrink-0 rounded-2xl border border-border/60 bg-card p-3 shadow-sm lg:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {isPending ? (
            <p className="text-sm text-muted-foreground">Loading admin console…</p>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <p className="text-sm font-medium text-destructive">
                {(error as Error).message || "We could not load your account."}
              </p>
            </div>
          ) : portal && portal.role === "super_admin" ? (
            <Outlet />
          ) : null}
        </main>
      </div>
    </div>
  );
}
