import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, CalendarDays, ClipboardList, Stethoscope, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDoctorDashboardStats, rescheduleAppointment } from "@/lib/doctor.functions";

export const Route = createFileRoute("/_authenticated/doctor/dashboard")({
  head: () => ({
    meta: [
      { title: "Doctor Dashboard — Sehaty Cloud" },
      {
        name: "description",
        content: "Your patients, appointments and prescriptions at a glance.",
      },
      { property: "og:title", content: "Doctor Dashboard — Sehaty Cloud" },
      { property: "og:description", content: "Your clinic day at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorDashboard,
});

type DashboardStats = Awaited<ReturnType<typeof getDoctorDashboardStats>>;
type TodayAppointment = DashboardStats["todayAppointmentsList"][number];

const statusLabels: Record<string, string> = {
  pending: "Awaiting acceptance",
  scheduled: "Scheduled",
};

function DoctorDashboard() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(getDoctorDashboardStats);
  const reschedule = useServerFn(rescheduleAppointment);
  const queryClient = useQueryClient();
  const [rescheduleTarget, setRescheduleTarget] = useState<TodayAppointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["doctor-dashboard-stats"],
    queryFn: () => fetchStats() as Promise<DashboardStats>,
    staleTime: 30_000,
  });

  const rescheduleMutation = useMutation({
    mutationFn: (input: { appointmentId: string; date: string; time: string }) =>
      reschedule({ data: input }),
    onSuccess: () => {
      toast.success("Appointment rescheduled");
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
      setRescheduleTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
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
  const statCards = [
    {
      icon: CalendarDays,
      label: "Today's Appointments",
      value: stats.todaysAppointments,
      accent: "bg-primary/10 text-primary",
    },
    {
      icon: ClipboardList,
      label: "Pending Prescriptions",
      value: stats.pendingPrescriptions,
      accent: "bg-violet/10 text-violet",
    },
    {
      icon: Users,
      label: "Total Patients",
      value: stats.totalPatients,
      accent: "bg-chart-2/15 text-chart-2",
    },
    {
      icon: CalendarClock,
      label: "This Week's Schedule",
      value: stats.thisWeekSchedule,
      accent: "bg-chart-4/15 text-chart-4",
    },
  ];

  function openReschedule(appointment: TodayAppointment) {
    setRescheduleTarget(appointment);
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewTime(appointment.time.slice(0, 5));
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
        <div className="glow-top pointer-events-none absolute inset-0" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Doctor dashboard</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Your clinic day at a glance.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card-hover rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}
            >
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-2xl font-bold tracking-tight">{card.value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold">Today's appointments</h2>
        {stats.todayAppointmentsList.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No appointments scheduled for today.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {stats.todayAppointmentsList.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:bg-secondary/50"
              >
                <div>
                  <p className="text-sm font-semibold">{appointment.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.time.slice(0, 5)} ·{" "}
                    {statusLabels[appointment.status] ?? appointment.status}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {statusLabels[appointment.status] ?? appointment.status}
                  </Badge>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      navigate({
                        to: "/doctor/consultation/$appointmentId",
                        params: { appointmentId: appointment.id },
                      })
                    }
                  >
                    <Stethoscope className="mr-1.5 h-4 w-4" /> Start Consultation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => openReschedule(appointment)}
                  >
                    Reschedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>{rescheduleTarget?.patientName}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date">Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-time">Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setRescheduleTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={rescheduleMutation.isPending || !newDate || !newTime}
              onClick={() =>
                rescheduleTarget &&
                rescheduleMutation.mutate({
                  appointmentId: rescheduleTarget.id,
                  date: newDate,
                  time: newTime,
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
