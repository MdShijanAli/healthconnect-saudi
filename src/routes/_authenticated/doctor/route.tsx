import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CalendarCheck,
  CalendarClock,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { dashboardForRole } from "@/lib/portal-navigation";
import { usePortalContext } from "@/components/portal-shell";

export const Route = createFileRoute("/_authenticated/doctor")({
  component: DoctorLayout,
});

const navItems = [
  { to: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/availability", label: "Availability", icon: CalendarClock },
  { to: "/doctor/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/doctor/medicines", label: "Medicines", icon: Pill },
  { to: "/doctor/profile", label: "Profile", icon: UserCog },
] as const;

function DoctorLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: portal, isPending, error } = usePortalContext();

  useEffect(() => {
    if (portal && portal.role !== "doctor") {
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
                  Doctor
                </Badge>
              </div>
            ) : null}
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>

      {isPending ? (
        <p className="mx-auto max-w-[1400px] px-4 py-10 text-sm text-muted-foreground">
          Loading doctor portal…
        </p>
      ) : error ? (
        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm font-medium text-destructive">
              {(error as Error).message || "We could not load your account."}
            </p>
          </div>
        </div>
      ) : portal && portal.role === "doctor" && portal.doctorStatus !== "approved" ? (
        <main className="mx-auto max-w-[1400px] px-4 py-10">
          <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock3 className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">
              {portal.doctorStatus === "rejected"
                ? "Your application was not approved"
                : "Your application is under review"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {portal.doctorStatus === "rejected"
                ? "Please contact our provider team to review your credentials and reapply."
                : "Our team is verifying your medical license and credentials. You'll get access to your portal as soon as a super admin approves your account."}
            </p>
          </div>
        </main>
      ) : portal && portal.role === "doctor" ? (
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
            <Outlet />
          </main>
        </div>
      ) : null}
    </div>
  );
}
