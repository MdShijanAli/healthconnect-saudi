import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getMyDoctorProfile, updateDoctorProfile } from "@/lib/doctor.functions";
import { usePortalContext } from "@/components/portal-shell";
import { useSpecializations } from "@/lib/specializations";

export const Route = createFileRoute("/_authenticated/doctor/profile")({
  head: () => ({
    meta: [
      { title: "Profile Settings — Sehaty Cloud" },
      { name: "description", content: "Edit your public doctor profile." },
      { property: "og:title", content: "Profile Settings — Sehaty Cloud" },
      { property: "og:description", content: "Update your specialization, bio, fee and photo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type MyProfile = Awaited<ReturnType<typeof getMyDoctorProfile>>;

function ProfilePage() {
  const { data: portal } = usePortalContext();
  const { data: specializations } = useSpecializations();
  const fetchProfile = useServerFn(getMyDoctorProfile);
  const save = useServerFn(updateDoctorProfile);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["doctor-my-profile"],
    queryFn: () => fetchProfile() as Promise<MyProfile>,
  });

  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [fee, setFee] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data) {
      setSpecialization(data.specialization);
      setBio(data.bio);
      setFee(String(data.consultation_fee));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let profilePhotoPath: string | undefined;
      if (photo && portal) {
        setUploading(true);
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `${portal.userId}/profile.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, photo, { upsert: true });
        setUploading(false);
        if (uploadError) throw new Error(uploadError.message);
        profilePhotoPath = path;
      }
      await save({
        data: {
          specialization,
          bio,
          consultationFee: Number(fee) || 0,
          profilePhotoPath,
        },
      });
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["doctor-my-profile"] });
      setPhoto(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading profile…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This information also appears on the "Meet Our Doctors" section of the public landing
          page.
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
            <Label htmlFor="doctor-photo">Profile photo</Label>
            <Input
              id="doctor-photo"
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
          <div className="space-y-1.5">
            <Label htmlFor="doctor-specialization">Specialization</Label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger id="doctor-specialization">
                <SelectValue placeholder="Select your specialization" />
              </SelectTrigger>
              <SelectContent>
                {(specializations ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
                {specialization &&
                !(specializations ?? []).some((s) => s.name === specialization) ? (
                  <SelectItem value={specialization}>{specialization}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doctor-fee">Consultation fee (SAR)</Label>
            <Input
              id="doctor-fee"
              type="number"
              min={0}
              step="1"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doctor-bio">Bio</Label>
            <Textarea
              id="doctor-bio"
              rows={5}
              minLength={20}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
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
