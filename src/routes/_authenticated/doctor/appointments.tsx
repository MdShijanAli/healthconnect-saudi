import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarX2, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptAppointment,
  cancelAppointment,
  listDoctorAppointments,
  markAppointmentComplete,
  rescheduleAppointment,
} from "@/lib/doctor.functions";

export const Route = createFileRoute("/_authenticated/doctor/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — Sehaty Cloud" },
      {
        name: "description",
        content: "Manage your upcoming, completed and cancelled appointments.",
      },
      { property: "og:title", content: "Appointments — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Accept, reschedule, complete or cancel appointments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppointmentsPage,
});

type Appointment = {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  cancel_reason: string | null;
  fee: number;
  patient: { full_name: string; phone: string } | null;
};

const statusVariants: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  scheduled: "default",
  completed: "default",
  cancelled: "destructive",
};

function AppointmentsPage() {
  const navigate = useNavigate();
  const fetchAppointments = useServerFn(listDoctorAppointments);
  const accept = useServerFn(acceptAppointment);
  const reschedule = useServerFn(rescheduleAppointment);
  const markComplete = useServerFn(markAppointmentComplete);
  const cancel = useServerFn(cancelAppointment);
  const queryClient = useQueryClient();

  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: () => fetchAppointments() as Promise<Appointment[]>,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
  }

  const acceptMutation = useMutation({
    mutationFn: (appointmentId: string) => accept({ data: { appointmentId } }),
    onSuccess: () => {
      toast.success("Appointment accepted");
      invalidate();
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

  const completeMutation = useMutation({
    mutationFn: (appointmentId: string) => markComplete({ data: { appointmentId } }),
    onSuccess: () => {
      toast.success("Appointment marked complete");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (input: { appointmentId: string; reason: string }) => cancel({ data: input }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      invalidate();
      setCancelTarget(null);
      setCancelReason("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openReschedule(appointment: Appointment) {
    setRescheduleTarget(appointment);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.appointment_time.slice(0, 5));
  }

  function submitCancel() {
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 5) {
      toast.error("Please provide a short reason (at least 5 characters).");
      return;
    }
    cancelMutation.mutate({ appointmentId: cancelTarget.id, reason: cancelReason.trim() });
  }

  const appointments = data ?? [];
  const upcoming = appointments.filter((a) => a.status === "pending" || a.status === "scheduled");
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  function AppointmentCard({ appointment }: { appointment: Appointment }) {
    return (
      <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">
              {appointment.patient?.full_name ?? "Unknown patient"}
            </h3>
            <p className="text-sm text-muted-foreground">
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
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              navigate({
                to: "/doctor/patients/$patientId",
                params: { patientId: appointment.patient_id },
              })
            }
          >
            <User className="mr-1.5 h-4 w-4" /> View patient
          </Button>
          {appointment.status === "pending" ? (
            <Button
              size="sm"
              className="rounded-full"
              disabled={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate(appointment.id)}
            >
              Accept
            </Button>
          ) : null}
          {appointment.status === "scheduled" ? (
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
          ) : null}
          {appointment.status === "pending" || appointment.status === "scheduled" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => openReschedule(appointment)}
              >
                Reschedule
              </Button>
              {appointment.status === "scheduled" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(appointment.id)}
                >
                  Mark as Complete
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                onClick={() => {
                  setCancelTarget(appointment);
                  setCancelReason("");
                }}
              >
                Cancel
              </Button>
            </>
          ) : null}
        </div>
      </article>
    );
  }

  function EmptyState({ label }: { label: string }) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <CalendarX2 className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Appointments</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your appointments across every stage.
        </p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading appointments…</p>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 grid gap-4">
            {upcoming.length === 0 ? (
              <EmptyState label="No upcoming appointments." />
            ) : (
              upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4 grid gap-4">
            {completed.length === 0 ? (
              <EmptyState label="No completed appointments yet." />
            ) : (
              completed.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            )}
          </TabsContent>
          <TabsContent value="cancelled" className="mt-4 grid gap-4">
            {cancelled.length === 0 ? (
              <EmptyState label="No cancelled appointments." />
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
            <DialogDescription>{rescheduleTarget?.patient?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="appt-reschedule-date">Date</Label>
              <Input
                id="appt-reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-reschedule-time">Time</Label>
              <Input
                id="appt-reschedule-time"
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

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>
              Let {cancelTarget?.patient?.full_name ?? "the patient"} know why.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              minLength={5}
              maxLength={500}
              rows={4}
              placeholder="e.g. Emergency clinic closure."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setCancelTarget(null)}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={cancelMutation.isPending}
              onClick={submitCancel}
            >
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
