import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAvailableSlots,
  getDoctorAvailabilityForBooking,
  getDoctorProfileForPatient,
} from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/doctors/$doctorId")({
  head: () => ({
    meta: [
      { title: "Doctor Profile — Sehaty Cloud" },
      { name: "description", content: "View doctor details and book an appointment." },
      { property: "og:title", content: "Doctor Profile — Sehaty Cloud" },
      { property: "og:description", content: "Pick a date and time to book your consultation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorProfilePage,
});

type DoctorProfile = Awaited<ReturnType<typeof getDoctorProfileForPatient>>;
type Availability = Awaited<ReturnType<typeof getDoctorAvailabilityForBooking>>;

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function DoctorProfilePage() {
  const { doctorId } = Route.useParams();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getDoctorProfileForPatient);
  const fetchAvailability = useServerFn(getDoctorAvailabilityForBooking);
  const fetchSlots = useServerFn(getAvailableSlots);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const {
    data: doctor,
    isPending,
    error,
  } = useQuery({
    queryKey: ["patient-doctor-profile", doctorId],
    queryFn: () => fetchProfile({ data: { doctorId } }) as Promise<DoctorProfile>,
  });
  const { data: availability } = useQuery({
    queryKey: ["patient-doctor-availability", doctorId],
    queryFn: () => fetchAvailability({ data: { doctorId } }) as Promise<Availability>,
  });
  const { data: slots, isPending: slotsPending } = useQuery({
    queryKey: ["patient-doctor-slots", doctorId, selectedDate],
    queryFn: () => fetchSlots({ data: { doctorId, date: selectedDate! } }) as Promise<string[]>,
    enabled: !!selectedDate,
  });

  const bookableDates = useMemo(() => {
    if (!availability) return [];
    const enabledDays = new Set(availability.enabledDays);
    const unavailable = new Set(availability.unavailableDates);
    return nextDays(21).filter(
      (d) => enabledDays.has(d.getDay()) && !unavailable.has(d.toISOString().slice(0, 10)),
    );
  }, [availability]);

  if (isPending) return <p className="text-sm text-muted-foreground">Loading doctor…</p>;
  if (error || !doctor) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm font-medium text-destructive">
          {(error as Error)?.message ?? "This doctor could not be found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent">
            {doctor.photoUrl ? (
              <img
                src={doctor.photoUrl}
                alt={doctor.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-9 w-9 text-accent-foreground" />
            )}
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{doctor.fullName}</h1>
            <p className="text-sm font-medium text-primary">{doctor.specialization}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {doctor.yearsExperience} years experience
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto rounded-full">
            SAR {doctor.consultationFee} / visit
          </Badge>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Choose a date</h2>
        {bookableDates.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This doctor has no availability in the next 3 weeks.
          </p>
        ) : (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {bookableDates.map((date) => {
              const dateStr = date.toISOString().slice(0, 10);
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedTime(null);
                  }}
                  className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="text-xs">{dayLabels[date.getDay()]}</span>
                  <span className="font-semibold">{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedDate ? (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              Available times
            </h3>
            {slotsPending ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading times…</p>
            ) : !slots || slots.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No open slots on this date.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {slots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      selectedTime === time
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <Button
          className="mt-6 w-full rounded-full sm:w-auto"
          disabled={!selectedDate || !selectedTime}
          onClick={() =>
            navigate({
              to: "/patient/booking/$doctorId/confirm",
              params: { doctorId },
              search: { date: selectedDate ?? "", time: selectedTime ?? "" },
            })
          }
        >
          Book Appointment
        </Button>
      </div>

      <Button asChild variant="ghost" size="sm" className="rounded-full">
        <Link to="/patient/doctors">Back to search</Link>
      </Button>
    </div>
  );
}
