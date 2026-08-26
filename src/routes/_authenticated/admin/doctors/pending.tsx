import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BadgeCheck, Eye, ShieldCheck, UserCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listPendingDoctors, reviewDoctor } from "@/lib/auth.functions";
import { getSignedPhotoUrl } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/doctors/pending")({
  head: () => ({
    meta: [
      { title: "Doctor Approval Queue — Sehaty Cloud" },
      { name: "description", content: "Review and approve pending doctor applications." },
      { property: "og:title", content: "Doctor Approval Queue — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Approve or reject doctors applying to join Sehaty Cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PendingDoctorsPage,
});

type PendingDoctor = {
  user_id: string;
  specialization: string;
  medical_license_number: string;
  years_experience: number;
  consultation_fee: number;
  bio: string;
  profile_photo_path: string | null;
  approval_status: string;
  created_at: string;
  profile: { full_name: string; phone: string } | null;
};

function PendingDoctorsPage() {
  const fetchPending = useServerFn(listPendingDoctors);
  const review = useServerFn(reviewDoctor);
  const fetchSignedUrl = useServerFn(getSignedPhotoUrl);
  const queryClient = useQueryClient();

  const [rejectTarget, setRejectTarget] = useState<PendingDoctor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [profileTarget, setProfileTarget] = useState<PendingDoctor | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["pending-doctors"],
    queryFn: () => fetchPending() as Promise<PendingDoctor[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { doctorId: string; status: "approved" | "rejected"; reason?: string }) =>
      review({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.status === "approved" ? "Doctor approved" : "Application rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function openProfile(doctor: PendingDoctor) {
    setProfileTarget(doctor);
    setPhotoUrl(null);
    if (doctor.profile_photo_path) {
      setPhotoLoading(true);
      try {
        const result = await fetchSignedUrl({ data: { path: doctor.profile_photo_path } });
        setPhotoUrl(result.url);
      } catch {
        setPhotoUrl(null);
      } finally {
        setPhotoLoading(false);
      }
    }
  }

  function submitReject() {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Please provide a short reason (at least 5 characters).");
      return;
    }
    mutation.mutate({
      doctorId: rejectTarget.user_id,
      status: "rejected",
      reason: rejectReason.trim(),
    });
  }

  const doctors = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Doctor approval queue</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Review and approve pending doctor applications.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Pending applications ({doctors.length})</h2>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : doctors.length === 0 ? (
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
                  <h3 className="text-base font-semibold">
                    {doctor.profile?.full_name ?? "Unnamed applicant"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialization} · {doctor.years_experience} yrs · SAR{" "}
                    {doctor.consultation_fee}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    License {doctor.medical_license_number} · Submitted{" "}
                    {new Date(doctor.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  Pending review
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => openProfile(doctor)}
                >
                  <Eye className="mr-1.5 h-4 w-4" /> View profile
                </Button>
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
                  onClick={() => {
                    setRejectTarget(doctor);
                    setRejectReason("");
                  }}
                >
                  <X className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!profileTarget} onOpenChange={(open) => !open && setProfileTarget(null)}>
        <DialogContent className="max-w-lg">
          {profileTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>{profileTarget.profile?.full_name ?? "Unnamed applicant"}</DialogTitle>
                <DialogDescription>
                  {profileTarget.specialization} · License {profileTarget.medical_license_number}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    Uploaded document
                  </p>
                  {!profileTarget.profile_photo_path ? (
                    <p className="text-muted-foreground">No documents uploaded.</p>
                  ) : photoLoading ? (
                    <p className="text-muted-foreground">Loading…</p>
                  ) : photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Uploaded profile document"
                      className="h-40 w-40 rounded-xl border border-border/60 object-cover"
                    />
                  ) : (
                    <p className="text-muted-foreground">Could not load the uploaded document.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Phone</p>
                    <p>{profileTarget.profile?.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Experience
                    </p>
                    <p>{profileTarget.years_experience} years</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Consultation fee
                    </p>
                    <p>SAR {profileTarget.consultation_fee}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Submitted
                    </p>
                    <p>{new Date(profileTarget.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Bio</p>
                  <p className="mt-1 leading-relaxed">{profileTarget.bio}</p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Let {rejectTarget?.profile?.full_name ?? "the applicant"} know why their application
              was not approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              minLength={5}
              maxLength={500}
              rows={4}
              placeholder="e.g. Medical license number could not be verified."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setRejectTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={mutation.isPending}
              onClick={submitReject}
            >
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
