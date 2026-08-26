import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Stethoscope, Users, Wallet } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Sehaty Cloud" },
      {
        name: "description",
        content: "Platform overview: doctors, patients, appointments and revenue.",
      },
      { property: "og:title", content: "Admin Dashboard — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Approve providers and oversee the Sehaty Cloud clinic network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

const statusLabels: Record<string, string> = {
  pending_approval: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const statusVariants: Record<string, "secondary" | "default" | "destructive"> = {
  pending_approval: "secondary",
  approved: "default",
  rejected: "destructive",
};

function AdminDashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => fetchStats() as Promise<DashboardStats>,
    staleTime: 30_000,
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm font-medium text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const stats = data!;
  const chartData = stats.appointmentsLast7Days.map((d) => ({
    label: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    count: d.count,
  }));

  const statCards = [
    { icon: Stethoscope, label: "Total Doctors", value: stats.totalDoctors.toLocaleString() },
    { icon: Users, label: "Total Patients", value: stats.totalPatients.toLocaleString() },
    {
      icon: CalendarClock,
      label: "Today's Appointments",
      value: stats.todaysAppointments.toLocaleString(),
    },
    { icon: Wallet, label: "Total Revenue", value: `SAR ${stats.totalRevenue.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin dashboard</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Platform overview at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <p className="mt-4 text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Appointments — last 7 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Appointments"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Recent doctor registration requests</h2>
        {stats.recentDoctorRequests.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No registration requests yet.</p>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentDoctorRequests.map((doctor) => (
                  <TableRow key={doctor.userId}>
                    <TableCell className="font-medium">{doctor.fullName}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariants[doctor.status] ?? "secondary"}
                        className="rounded-full"
                      >
                        {statusLabels[doctor.status] ?? doctor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
