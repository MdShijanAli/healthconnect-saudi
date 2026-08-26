import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookAppointment, getDoctorProfileForPatient } from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/booking/$doctorId/confirm")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: String(search["date"] ?? ""),
    time: String(search["time"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "Confirm Booking — Sehaty Cloud" },
      { name: "description", content: "Confirm your appointment details." },
      { property: "og:title", content: "Confirm Booking — Sehaty Cloud" },
      { property: "og:description", content: "Review and confirm your appointment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingConfirmPage,
});

type DoctorProfile = Awaited<ReturnType<typeof getDoctorProfileForPatient>>;

function BookingConfirmPage() {
  const { doctorId } = Route.useParams();
  const { date, time } = Route.useSearch();
  const fetchProfile = useServerFn(getDoctorProfileForPatient);
  const book = useServerFn(bookAppointment);

  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const { data: doctor, isPending } = useQuery({
    queryKey: ["patient-doctor-profile", doctorId],
    queryFn: () => fetchProfile({ data: { doctorId } }) as Promise<DoctorProfile>,
  });

  const bookMutation = useMutation({
    mutationFn: () => book({ data: { doctorId, date, time, reason: reason.trim() } }),
    onSuccess: () => {
      setConfirmed(true);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!date || !time) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm font-medium text-destructive">
          No date or time was selected. Please go back and pick a slot.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
          <Link to="/patient/doctors/$doctorId" params={{ doctorId }}>
            Back to doctor profile
          </Link>
        </Button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-10 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-semibold">Booking request sent</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your request with {doctor?.fullName} on {new Date(date).toLocaleDateString()} at {time}{" "}
          has been sent and is awaiting the doctor's confirmation.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-full">
            <Link to="/patient/appointments">View my appointments</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/patient/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Confirm booking</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Double-check the details before confirming.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{isPending ? "Loading…" : doctor?.fullName}</p>
            <p className="text-xs text-muted-foreground">{doctor?.specialization}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Date</p>
            <p>
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Time</p>
            <p>{time}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Consultation fee
            </p>
            <p>SAR {doctor?.consultationFee ?? "—"}</p>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="booking-reason">Reason for visit</Label>
          <Textarea
            id="booking-reason"
            rows={4}
            minLength={5}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe why you'd like to see the doctor…"
          />
        </div>

        <Button
          className="mt-5 w-full rounded-full"
          disabled={bookMutation.isPending || reason.trim().length < 5}
          onClick={() => bookMutation.mutate()}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
