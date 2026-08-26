import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { HeartPulse, Loader2, ShieldCheck, Stethoscope, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getPortalContext } from "@/lib/auth.functions";
import { dashboardForRole } from "@/lib/portal-navigation";
import type { PortalContext } from "@/lib/auth-schemas";

const demoAccounts = [
  {
    label: "Super Admin",
    icon: ShieldCheck,
    email: "admin@sehatycloud.sa",
    password: "Admin@12345",
  },
  {
    label: "Doctor",
    icon: Stethoscope,
    email: "doctor@sehatycloud.sa",
    password: "Doctor@12345",
  },
  {
    label: "Patient",
    icon: User,
    email: "patient@sehatycloud.sa",
    password: "Patient@12345",
  },
] as const;

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Sehaty Cloud" },
      {
        name: "description",
        content: "Sign in to your Sehaty Cloud clinic, doctor or patient portal.",
      },
      { property: "og:title", content: "Sign in — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Access your Sehaty Cloud portal securely with email and password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const fetchPortal = useServerFn(getPortalContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      const portal = (await fetchPortal()) as PortalContext;
      navigate({ to: dashboardForRole(portal.role), replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Sehaty Cloud</span>
        </Link>

        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-lg">
          <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your clinic, doctor or patient portal.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.sa"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold">Demo accounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use any of these to explore the platform. Tap one to fill the form above.
          </p>
          <div className="mt-4 space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setError(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-border/60 px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <account.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">{account.label}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {account.email} · {account.password}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
