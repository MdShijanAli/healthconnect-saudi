import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fileToDataUrl } from "@/lib/mock-photo";
import { usePortalContext } from "@/components/portal-shell";
import { getMyPatientProfile, updatePatientProfile } from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Sehaty Cloud" },
      { name: "description", content: "Edit your personal information." },
      { property: "og:title", content: "Profile — Sehaty Cloud" },
      { property: "og:description", content: "Keep your personal details up to date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientProfilePage,
});

type MyProfile = Awaited<ReturnType<typeof getMyPatientProfile>>;

function PatientProfilePage() {
  const { data: portal } = usePortalContext();
  const fetchProfile = useServerFn(getMyPatientProfile);
  const save = useServerFn(updatePatientProfile);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["patient-my-profile"],
    queryFn: () => fetchProfile() as Promise<MyProfile>,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName);
      setPhone(data.phone);
      setDateOfBirth(data.dateOfBirth);
      setGender(data.gender as "male" | "female");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let profilePhotoPath: string | undefined;
      if (photo && portal) {
        setUploading(true);
        profilePhotoPath = await fileToDataUrl(photo);
        setUploading(false);
      }
      await save({
        data: { fullName, phone, dateOfBirth, gender, profilePhotoPath },
      });
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["patient-my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["portal-context"] });
      setPhoto(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading profile…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Keep your personal details up to date.
        </p>
      </div>

      <div className="max-w-xl rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
            {photo ? (
              <img
                src={URL.createObjectURL(photo)}
                alt="New profile"
                className="h-full w-full object-cover"
              />
            ) : data?.photoUrl ? (
              <img src={data.photoUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7" />
            )}
          </span>
          <div className="space-y-1.5">
            <Label htmlFor="patient-photo">Profile photo</Label>
            <Input
              id="patient-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="patient-name">Full name</Label>
              <Input
                id="patient-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patient-phone">Phone</Label>
              <Input
                id="patient-phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patient-dob">Date of birth</Label>
              <Input
                id="patient-dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patient-gender">Gender</Label>
              <Select value={gender} onValueChange={(value: "male" | "female") => setGender(value)}>
                <SelectTrigger id="patient-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="rounded-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending || uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
