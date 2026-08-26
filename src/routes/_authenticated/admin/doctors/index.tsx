import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Eye, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSignedPhotoUrl, listDoctors, toggleDoctorActive } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/doctors/")({
  head: () => ({
    meta: [
      { title: "Doctor Management — Sehaty Cloud" },
      { name: "description", content: "Manage approved doctors on the Sehaty Cloud platform." },
      { property: "og:title", content: "Doctor Management — Sehaty Cloud" },
      {
        property: "og:description",
        content: "View and manage every approved doctor on Sehaty Cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorManagementPage,
});

type Doctor = {
  user_id: string;
  specialization: string;
  medical_license_number: string;
  years_experience: number;
  consultation_fee: number;
  bio: string;
  profile_photo_path: string | null;
  is_active: boolean;
  created_at: string;
  profile: { full_name: string; phone: string } | null;
  totalAppointments: number;
  totalPatients: number;
};

function DoctorManagementPage() {
  const fetchDoctors = useServerFn(listDoctors);
  const toggleActive = useServerFn(toggleDoctorActive);
  const fetchSignedUrl = useServerFn(getSignedPhotoUrl);
  const queryClient = useQueryClient();

  const [profileTarget, setProfileTarget] = useState<Doctor | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => fetchDoctors() as Promise<Doctor[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { doctorId: string; isActive: boolean }) => toggleActive({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.isActive ? "Doctor activated" : "Doctor suspended");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function openProfile(doctor: Doctor) {
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

  const doctors = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Doctor management</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          All approved doctors on the platform.
        </p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading doctors…</p>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <Stethoscope className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No approved doctors yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.user_id}>
                  <TableCell className="font-medium">
                    {doctor.profile?.full_name ?? "Unnamed"}
                  </TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>
                    <Badge
                      variant={doctor.is_active ? "default" : "destructive"}
                      className="rounded-full"
                    >
                      {doctor.is_active ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell>{doctor.totalPatients}</TableCell>
                  <TableCell>{doctor.totalAppointments}</TableCell>
                  <TableCell>{new Date(doctor.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => openProfile(doctor)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" /> View
                      </Button>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={doctor.is_active}
                          disabled={mutation.isPending}
                          onCheckedChange={(checked) =>
                            mutation.mutate({ doctorId: doctor.user_id, isActive: checked })
                          }
                          aria-label={doctor.is_active ? "Suspend doctor" : "Activate doctor"}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!profileTarget} onOpenChange={(open) => !open && setProfileTarget(null)}>
        <DialogContent className="max-w-lg">
          {profileTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>{profileTarget.profile?.full_name ?? "Unnamed doctor"}</DialogTitle>
                <DialogDescription>
                  {profileTarget.specialization} · License {profileTarget.medical_license_number}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    Profile photo
                  </p>
                  {!profileTarget.profile_photo_path ? (
                    <p className="text-muted-foreground">No photo uploaded.</p>
                  ) : photoLoading ? (
                    <p className="text-muted-foreground">Loading…</p>
                  ) : photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Doctor profile"
                      className="h-40 w-40 rounded-xl border border-border/60 object-cover"
                    />
                  ) : (
                    <p className="text-muted-foreground">Could not load the photo.</p>
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
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Joined</p>
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
    </div>
  );
}
