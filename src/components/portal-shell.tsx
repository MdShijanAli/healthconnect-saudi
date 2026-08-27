import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import {
  CalendarCheck,
  ChevronsUpDown,
  ClipboardCheck,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { getPortalContext } from "@/lib/auth.functions";
import { dashboardForRole } from "@/lib/portal-navigation";
import type { PortalContext, PortalRole } from "@/lib/auth-schemas";

const roleLabels: Record<PortalRole, string> = {
  super_admin: "Super Admin",
  doctor: "Doctor",
  patient: "Patient",
};

const portalTitles: Record<PortalRole, string> = {
  super_admin: "Admin Console",
  doctor: "Doctor Portal",
  patient: "Patient Portal",
};

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const navByRole: Record<PortalRole, NavItem[]> = {
  super_admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/dashboard", label: "Approval queue", icon: ClipboardCheck },
  ],
  doctor: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/doctor/dashboard", label: "Appointments", icon: CalendarCheck },
    { to: "/doctor/dashboard", label: "Patients", icon: Users },
    { to: "/doctor/dashboard", label: "Prescriptions", icon: Pill },
  ],
  patient: [
    { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patient/dashboard", label: "Appointments", icon: CalendarCheck },
    { to: "/patient/dashboard", label: "Doctors", icon: Stethoscope },
    { to: "/patient/dashboard", label: "Records", icon: FileText },
  ],
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading your portal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            {(error as Error).message || "We could not load your account."}
          </p>
        </div>
      </div>
    );
  }

  if (!portal || portal.role !== allow) return null;

  const navItems = navByRole[portal.role];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="hover:bg-transparent">
                <Link to="/">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HeartPulse className="h-4 w-4" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-bold tracking-tight">Sehaty Cloud</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {portalTitles[portal.role]}
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item, index) => (
                  <SidebarMenuItem key={`${item.to}-${item.label}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={index === 0 && pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials(portal.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-sm font-semibold">{portal.fullName}</span>
                      <span className="truncate text-xs text-sidebar-foreground/60">
                        {roleLabels[portal.role]}
                      </span>
                    </span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{portal.fullName}</span>
                      <span className="text-xs text-muted-foreground">{portal.phone}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onSelect={(event) => {
                      event.preventDefault();
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex flex-1 items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted-foreground">
              {portalTitles[portal.role]}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-medium sm:inline">{portal.fullName}</span>
              <Badge variant="secondary" className="rounded-full">
                {roleLabels[portal.role]}
              </Badge>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children(portal)}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
