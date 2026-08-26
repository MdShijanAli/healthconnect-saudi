import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Eye, Users } from "lucide-react";
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
import { listPatients, togglePatientBlocked } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/patients")({
  head: () => ({
    meta: [
      { title: "Patient Management — Sehaty Cloud" },
      { name: "description", content: "Manage patients registered on the Sehaty Cloud platform." },
      { property: "og:title", content: "Patient Management — Sehaty Cloud" },
      { property: "og:description", content: "View and manage every patient on Sehaty Cloud." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientManagementPage,
});

type Patient = {
  user_id: string;
  date_of_birth: string;
  gender: string;
  is_blocked: boolean;
  created_at: string;
  profile: { full_name: string; phone: string } | null;
  email: string | null;
  totalAppointments: number;
};

function PatientManagementPage() {
  const fetchPatients = useServerFn(listPatients);
  const toggleBlocked = useServerFn(togglePatientBlocked);
  const queryClient = useQueryClient();
  const [profileTarget, setProfileTarget] = useState<Patient | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: () => fetchPatients() as Promise<Patient[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { patientId: string; isBlocked: boolean }) =>
      toggleBlocked({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.isBlocked ? "Patient blocked" : "Patient unblocked");
      queryClient.invalidateQueries({ queryKey: ["admin-patients"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const patients = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Patient management</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          All patients registered on the platform.
        </p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading patients…</p>
      ) : patients.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <Users className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No patients registered yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.user_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {patient.profile?.full_name ?? "Unnamed"}
                      {patient.is_blocked ? (
                        <Badge variant="destructive" className="rounded-full">
                          Blocked
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{patient.email ?? "—"}</TableCell>
                  <TableCell>{patient.profile?.phone ?? "—"}</TableCell>
                  <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{patient.totalAppointments}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setProfileTarget(patient)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" /> View
                      </Button>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!patient.is_blocked}
                          disabled={mutation.isPending}
                          onCheckedChange={(checked) =>
                            mutation.mutate({ patientId: patient.user_id, isBlocked: !checked })
                          }
                          aria-label={patient.is_blocked ? "Unblock patient" : "Block patient"}
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
        <DialogContent className="max-w-md">
          {profileTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>{profileTarget.profile?.full_name ?? "Unnamed patient"}</DialogTitle>
                <DialogDescription>{profileTarget.email ?? "No email on file"}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Phone</p>
                  <p>{profileTarget.profile?.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Gender</p>
                  <p className="capitalize">{profileTarget.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Date of birth
                  </p>
                  <p>{new Date(profileTarget.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Joined</p>
                  <p>{new Date(profileTarget.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Total appointments
                  </p>
                  <p>{profileTarget.totalAppointments}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                  <p>{profileTarget.is_blocked ? "Blocked" : "Active"}</p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
