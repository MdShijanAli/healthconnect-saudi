import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { HeartPulse, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getPortalContext } from "@/lib/auth.functions";
import { dashboardForRole } from "@/lib/portal-navigation";
import type { PortalContext, PortalRole } from "@/lib/auth-schemas";

const roleLabels: Record<PortalRole, string> = {
  super_admin: "Super Admin",
  doctor: "Doctor",
  patient: "Patient",
};

export function usePortalContext() {
  const fetchPortal = useServerFn(getPortalContext);
  return useQuery({
    queryKey: ["portal-context"],
    queryFn: () => fetchPortal() as Promise<PortalContext>,
    staleTime: 30_000,
  });
}

export function PortalShell({
  allow,
  title,
  subtitle,
  children,
}: {
  allow: PortalRole;
  title: string;
  subtitle?: string;
  children: (portal: PortalContext) => ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: portal, isPending, error } = usePortalContext();

  useEffect(() => {
    if (portal && portal.role !== allow) {
      navigate({ to: dashboardForRole(portal.role), replace: true });
    }
  }, [portal, allow, navigate]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
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
                  {roleLabels[portal.role]}
                </Badge>
              </div>
            ) : null}
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}

        <div className="mt-8">
          {isPending ? (
            <p className="text-sm text-muted-foreground">Loading your portal…</p>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <p className="text-sm font-medium text-destructive">
                {(error as Error).message || "We could not load your account."}
              </p>
            </div>
          ) : portal && portal.role === allow ? (
            children(portal)
          ) : null}
        </div>
      </main>
    </div>
  );
}
