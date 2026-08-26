import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, FileText, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getPatientProfileForDoctor } from "@/lib/doctor.functions";

export const Route = createFileRoute("/_authenticated/doctor/patients/$patientId")({
  head: () => ({
    meta: [
      { title: "Patient Profile — Sehaty Cloud" },
      { name: "description", content: "Patient visit history and prescriptions." },
      { property: "og:title", content: "Patient Profile — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Review a patient's visit history and past prescriptions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientProfilePage,
});

type PatientProfile = Awaited<ReturnType<typeof getPatientProfileForDoctor>>;

const statusVariants: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  scheduled: "default",
  completed: "default",
  cancelled: "destructive",
};

function PatientProfilePage() {
  const { patientId } = Route.useParams();
  const fetchProfile = useServerFn(getPatientProfileForDoctor);

  const { data, isPending, error } = useQuery({
    queryKey: ["doctor-patient-profile", patientId],
    queryFn: () => fetchProfile({ data: { patientId } }) as Promise<PatientProfile>,
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading patient…</p>;
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm font-medium text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const { profile, patientProfile, appointments, prescriptions } = data!;
  const age = Math.floor(
    (Date.now() - new Date(patientProfile.date_of_birth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {age} years · <span className="capitalize">{patientProfile.gender}</span> ·{" "}
              {profile.phone}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Visit history ({appointments.length})</h2>
        </div>
        {appointments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No visits yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(a.appointment_date).toLocaleDateString()} ·{" "}
                    {a.appointment_time.slice(0, 5)}
                  </p>
                  {a.reason ? <p className="text-xs text-muted-foreground">{a.reason}</p> : null}
                </div>
                <Badge
                  variant={statusVariants[a.status] ?? "secondary"}
                  className="rounded-full capitalize"
                >
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Past prescriptions ({prescriptions.length})</h2>
        </div>
        {prescriptions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No prescriptions written yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {prescriptions.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
                {p.diagnosis_notes ? <p className="mt-1 text-sm">{p.diagnosis_notes}</p> : null}
                {p.items.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {p.items.map((item) => (
                      <li key={item.id}>
                        • {item.medicine_name}
                        {item.dosage ? ` — ${item.dosage}` : ""}
                        {item.frequency ? `, ${item.frequency}` : ""}
                        {item.duration ? ` for ${item.duration}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {p.advice_notes ? (
                  <p className="mt-3 text-sm italic text-muted-foreground">{p.advice_notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
