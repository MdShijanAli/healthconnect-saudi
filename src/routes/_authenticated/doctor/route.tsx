import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CalendarCheck,
  CalendarClock,
  ChevronsUpDown,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  UserCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function DoctorLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: portal, isPending, error } = usePortalContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading doctor portal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm font-medium text-destructive">
            {(error as Error).message || "We could not load your account."}
          </p>
        </div>
      </div>
    );
  }

  if (!portal || portal.role !== "doctor") return null;

  if (portal.doctorStatus !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center shadow-soft">
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
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="cursor-default hover:bg-transparent">
                <Link to="/">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand text-primary-foreground shadow-soft">
                    <HeartPulse className="h-4 w-4" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-bold tracking-tight">Sehaty Cloud</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">Doctor Portal</span>
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
                {navItems.map((item) => {
                  const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
                      <span className="truncate text-xs text-sidebar-foreground/60">Doctor</span>
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
                  <DropdownMenuItem asChild>
                    <Link to="/doctor/profile">
                      <UserCog className="h-4 w-4" /> Profile settings
                    </Link>
                  </DropdownMenuItem>
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

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex flex-1 items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Doctor Portal</span>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-medium sm:inline">{portal.fullName}</span>
              <Badge variant="secondary" className="rounded-full">
                Doctor
              </Badge>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
