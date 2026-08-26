import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, ShieldCheck, UserCheck, X } from "lucide-react";
import { toast } from "sonner";

import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listPendingDoctors, reviewDoctor } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Console — Sehaty Cloud" },
      { name: "description", content: "Review doctor applications and manage the Sehaty Cloud network." },
      { property: "og:title", content: "Admin Console — Sehaty Cloud" },
      { property: "og:description", content: "Approve doctors and oversee the Sehaty Cloud clinic network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

type PendingDoctor = {
  user_id: string;
  specialization: string;
  medical_license_number: string;
  years_experience: number;
  consultation_fee: number;
  bio: string;
  created_at: string;
  profile: { full_name: string; phone: string } | null;
};

function AdminDashboard() {
  return (
    <PortalShell allow="super_admin" title="Admin console" subtitle="Approve providers and keep the network trusted.">
      {() => <PendingApprovals />}
    </PortalShell>
  );
}

function PendingApprovals() {
  const fetchPending = useServerFn(listPendingDoctors);
  const review = useServerFn(reviewDoctor);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["pending-doctors"],
    queryFn: () => fetchPending() as Promise<PendingDoctor[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { doctorId: string; status: "approved" | "rejected" }) =>
      review({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.status === "approved" ? "Doctor approved" : "Application rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-doctors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading applications…</p>;

  const doctors = data ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Doctor applications ({doctors.length})</h2>
      </div>

      {doctors.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <BadgeCheck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No pending applications right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {doctors.map((doctor) => (
            <article
              key={doctor.user_id}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{doctor.profile?.full_name ?? "Unnamed applicant"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialization} · {doctor.years_experience} yrs · SAR {doctor.consultation_fee}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    License {doctor.medical_license_number} · {doctor.profile?.phone ?? "no phone"}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">Pending review</Badge>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ doctorId: doctor.user_id, status: "approved" })}
                >
                  <UserCheck className="mr-1.5 h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ doctorId: doctor.user_id, status: "rejected" })}
                >
                  <X className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
