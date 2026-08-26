import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, FileText, Search, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePortalContext } from "@/components/portal-shell";
import { getPatientDashboard } from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/dashboard")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard — Sehaty Cloud" },
      { name: "description", content: "Your appointments, prescriptions and visits at a glance." },
      { property: "og:title", content: "Patient Dashboard — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Book care and track your health records in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientDashboard,
});

type Dashboard = Awaited<ReturnType<typeof getPatientDashboard>>;

const statusLabels: Record<string, string> = {
  pending: "Awaiting confirmation",
  scheduled: "Confirmed",
};

function PatientDashboard() {
  const { data: portal } = usePortalContext();
  const fetchDashboard = useServerFn(getPatientDashboard);
  const { data, isPending } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: () => fetchDashboard() as Promise<Dashboard>,
    staleTime: 30_000,
  });

  const quickActions = [
    { to: "/patient/doctors" as const, label: "Book New Appointment", icon: Search },
    { to: "/patient/prescriptions" as const, label: "View Prescriptions", icon: FileText },
    { to: "/patient/appointments" as const, label: "View Past Visits", icon: CalendarCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{portal ? `, ${portal.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here's what's happening with your care.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Upcoming appointment</h2>
        {isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : data?.upcomingAppointment ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4">
            <div>
              <p className="text-sm font-semibold">{data.upcomingAppointment.doctorName}</p>
              <p className="text-xs text-muted-foreground">
                {data.upcomingAppointment.specialization}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(data.upcomingAppointment.date).toLocaleDateString()} ·{" "}
                {data.upcomingAppointment.time.slice(0, 5)}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {statusLabels[data.upcomingAppointment.status] ?? data.upcomingAppointment.status}
            </Badge>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border/60 p-6 text-center">
            <Stethoscope className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No upcoming appointments yet.</p>
            <Button asChild size="sm" className="mt-4 rounded-full">
              <Link to="/patient/doctors">Book an appointment</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Button
            key={action.to}
            asChild
            variant="outline"
            className="h-auto flex-col gap-2 rounded-2xl py-6"
          >
            <Link to={action.to}>
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
