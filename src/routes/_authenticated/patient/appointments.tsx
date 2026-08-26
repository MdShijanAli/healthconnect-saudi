import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelPatientAppointment,
  listPatientAppointments,
  reschedulePatientAppointment,
} from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments — Sehaty Cloud" },
      { name: "description", content: "Track your upcoming, past and cancelled appointments." },
      { property: "og:title", content: "My Appointments — Sehaty Cloud" },
      { property: "og:description", content: "Manage your bookings in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppointmentsPage,
});

type Appointment = Awaited<ReturnType<typeof listPatientAppointments>>[number];

const statusVariants: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  scheduled: "default",
  completed: "default",
  cancelled: "destructive",
};

const CUTOFF_HOURS = 2;

function isWithinCutoff(date: string, time: string): boolean {
  const appointmentAt = new Date(`${date}T${time.slice(0, 5)}:00`);
  return appointmentAt.getTime() - Date.now() < CUTOFF_HOURS * 60 * 60 * 1000;
}

function AppointmentsPage() {
  const fetchAppointments = useServerFn(listPatientAppointments);
  const cancel = useServerFn(cancelPatientAppointment);
  const reschedule = useServerFn(reschedulePatientAppointment);
  const queryClient = useQueryClient();

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["patient-appointments"],
    queryFn: () => fetchAppointments() as Promise<Appointment[]>,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
  }

  const cancelMutation = useMutation({
    mutationFn: (input: { appointmentId: string }) => cancel({ data: input }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      invalidate();
      setCancelTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (input: { appointmentId: string; date: string; time: string }) =>
      reschedule({ data: input }),
    onSuccess: () => {
      toast.success("Appointment rescheduled");
      invalidate();
      setRescheduleTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const appointments = data ?? [];
  const upcoming = appointments.filter((a) => a.status === "pending" || a.status === "scheduled");
  const past = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  function openReschedule(appointment: Appointment) {
    setRescheduleTarget(appointment);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.appointment_time.slice(0, 5));
  }

  function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const cutoff = isWithinCutoff(appointment.appointment_date, appointment.appointment_time);
    const canModify = appointment.status === "pending" || appointment.status === "scheduled";

    return (
      <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">{appointment.doctorName}</h3>
            <p className="text-sm text-muted-foreground">{appointment.specialization}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(appointment.appointment_date).toLocaleDateString()} ·{" "}
              {appointment.appointment_time.slice(0, 5)}
            </p>
            {appointment.reason ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {appointment.reason}
              </p>
            ) : null}
            {appointment.cancel_reason ? (
              <p className="mt-2 text-sm text-destructive">
                Cancelled: {appointment.cancel_reason}
              </p>
            ) : null}
          </div>
          <Badge
            variant={statusVariants[appointment.status] ?? "secondary"}
            className="rounded-full capitalize"
          >
            {appointment.status}
          </Badge>
        </div>
        {canModify ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={cutoff}
              onClick={() => openReschedule(appointment)}
            >
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-destructive hover:text-destructive"
              disabled={cutoff}
              onClick={() => setCancelTarget(appointment)}
            >
              Cancel
            </Button>
            {cutoff ? (
              <p className="basis-full text-xs text-muted-foreground">
                Too close to the appointment time to cancel or reschedule (within {CUTOFF_HOURS}{" "}
                hours).
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  function EmptyState({ label }: { label: string }) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <CalendarX2 className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
        <Button asChild size="sm" className="mt-4 rounded-full">
          <Link to="/patient/doctors">Book an appointment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My appointments</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Track your bookings across every stage.
        </p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading appointments…</p>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 grid gap-4">
            {upcoming.length === 0 ? (
              <EmptyState label="No upcoming appointments." />
            ) : (
              upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-4 grid gap-4">
            {past.length === 0 ? (
              <EmptyState label="No past visits yet." />
            ) : (
              past.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            )}
          </TabsContent>
          <TabsContent value="cancelled" className="mt-4 grid gap-4">
            {cancelled.length === 0 ? (
              <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
                No cancelled appointments.
              </p>
            ) : (
              cancelled.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>{rescheduleTarget?.doctorName}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="patient-reschedule-date">Date</Label>
              <Input
                id="patient-reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patient-reschedule-time">Time</Label>
              <Input
                id="patient-reschedule-time"
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
              Back
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

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel appointment?</DialogTitle>
            <DialogDescription>
              Your appointment with {cancelTarget?.doctorName} will be cancelled. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setCancelTarget(null)}
            >
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={cancelMutation.isPending}
              onClick={() =>
                cancelTarget && cancelMutation.mutate({ appointmentId: cancelTarget.id })
              }
            >
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
