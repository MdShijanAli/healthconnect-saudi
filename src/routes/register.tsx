import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { HeartPulse, Loader2, Stethoscope, User } from "lucide-react";

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
import { completeRegistration } from "@/lib/auth.functions";
import { signUp, SESSION_STORAGE_KEY } from "@/lib/mock-auth";
import { fileToDataUrl } from "@/lib/mock-photo";
import { dashboardForRole } from "@/lib/portal-navigation";
import { useSpecializations } from "@/lib/specializations";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — Sehaty Cloud" },
      {
        name: "description",
        content:
          "Register as a doctor or patient on Sehaty Cloud, the Saudi clinic management platform.",
      },
      { property: "og:title", content: "Create your account — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Join Sehaty Cloud as a verified doctor or as a patient booking care in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

type Role = "patient" | "doctor";

function RegisterPage() {
  const navigate = useNavigate();
  const doSignUp = useServerFn(signUp);
  const submitRegistration = useServerFn(completeRegistration);
  const [role, setRole] = useState<Role>("patient");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const { data: specializations } = useSpecializations();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    try {
      const { token } = await doSignUp({ data: { email, password } });
      window.localStorage.setItem(SESSION_STORAGE_KEY, token);

      let profilePhotoPath: string | null = null;
      if (role === "doctor" && photo) {
        profilePhotoPath = await fileToDataUrl(photo);
      }

      const payload =
        role === "patient"
          ? {
              role: "patient" as const,
              fullName: String(form.get("fullName")),
              phone: String(form.get("phone")),
              dateOfBirth: String(form.get("dateOfBirth")),
              gender: String(form.get("gender")) as "male" | "female",
            }
          : {
              role: "doctor" as const,
              fullName: String(form.get("fullName")),
              phone: String(form.get("phone")),
              specialization: String(form.get("specialization")),
              medicalLicenseNumber: String(form.get("medicalLicenseNumber")),
              yearsExperience: Number(form.get("yearsExperience")),
              consultationFee: Number(form.get("consultationFee")),
              bio: String(form.get("bio")),
              profilePhotoPath,
            };

      await submitRegistration({ data: payload });
      navigate({ to: dashboardForRole(role), replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-xl">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Sehaty Cloud</span>
        </Link>

        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-lg">
          <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Patients get instant access. Doctors are verified by our team before going live.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { value: "patient" as const, label: "I'm a patient", icon: User },
              { value: "doctor" as const, label: "I'm a doctor", icon: Stethoscope },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`flex items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-colors ${
                  role === option.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" placeholder="Sarah Al-Rashid" />
              <Field id="phone" label="Phone" placeholder="+966 5X XXX XXXX" />
              <Field
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Field
                id="password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {role === "patient" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="dateOfBirth" label="Date of birth" type="date" />
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" required defaultValue="female">
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select name="specialization" required defaultValue="">
                      <SelectTrigger id="specialization">
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {(specializations ?? []).map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    id="medicalLicenseNumber"
                    label="Medical license number"
                    placeholder="SCFHS-123456"
                  />
                  <Field
                    id="yearsExperience"
                    label="Years of experience"
                    type="number"
                    min={0}
                    max={70}
                    placeholder="12"
                  />
                  <Field
                    id="consultationFee"
                    label="Consultation fee (SAR)"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="350"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Short bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    required
                    minLength={20}
                    maxLength={1000}
                    rows={4}
                    placeholder="Tell patients about your practice and experience."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="photo">Profile photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            )}

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {role === "doctor" ? "Submit application" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} required {...props} />
    </div>
  );
}
