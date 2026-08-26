import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Bell, CalendarCheck, FileText, Home, LogOut, Search, ShieldOff, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { dashboardForRole } from "@/lib/portal-navigation";
import { usePortalContext } from "@/components/portal-shell";
import { listNotifications } from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient")({
  component: PatientLayout,
});

const navItems = [
  { to: "/patient/dashboard", label: "Home", icon: Home },
  { to: "/patient/doctors", label: "Find a Doctor", icon: Search },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/patient/prescriptions", label: "Prescriptions", icon: FileText },
  { to: "/patient/profile", label: "Profile", icon: User },
] as const;

function PatientLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: portal, isPending, error } = usePortalContext();
  const fetchNotifications = useServerFn(listNotifications);

  const isPatient = portal?.role === "patient" && !portal.patientBlocked;
  const { data: notifications } = useQuery({
    queryKey: ["patient-notifications"],
    queryFn: () => fetchNotifications() as Promise<Awaited<ReturnType<typeof listNotifications>>>,
    enabled: isPatient,
    staleTime: 30_000,
  });
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  useEffect(() => {
    if (portal && portal.role !== "patient") {
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
    <div className="min-h-screen bg-muted/30 pb-16 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight">Sehaty Cloud</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isPatient ? (
              <Link
                to="/patient/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                ) : null}
              </Link>
            ) : null}
            {portal ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-semibold">{portal.fullName}</span>
                <Badge variant="secondary" className="rounded-full">
                  Patient
                </Badge>
              </div>
            ) : null}
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading your portal…</p>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm font-medium text-destructive">
              {(error as Error).message || "We could not load your account."}
            </p>
          </div>
        ) : portal && portal.role === "patient" && portal.patientBlocked ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldOff className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Your account has been blocked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please contact our support team for help restoring access to your account.
            </p>
          </div>
        ) : portal && portal.role === "patient" ? (
          <Outlet />
        ) : null}
      </main>

      {isPatient ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-primary" }}
                className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label === "Find a Doctor" ? "Doctors" : item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
