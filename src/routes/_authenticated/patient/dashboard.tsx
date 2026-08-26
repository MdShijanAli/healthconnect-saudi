import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, FileText, HeartPulse, Stethoscope } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/patient/dashboard")({
  head: () => ({
    meta: [
      { title: "Patient Portal — Sehaty Cloud" },
      { name: "description", content: "Book appointments, view visits and manage your medical records in the Sehaty Cloud patient portal." },
      { property: "og:title", content: "Patient Portal — Sehaty Cloud" },
      { property: "og:description", content: "Your appointments, prescriptions and medical records in one secure place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientDashboard,
});

function PatientDashboard() {
  return (
    <PortalShell allow="patient" title="Patient portal" subtitle="Your appointments, records and prescriptions.">
      {(portal) => (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <h2 className="text-lg font-semibold">Welcome back, {portal.fullName.split(" ")[0]}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Book a consultation with a verified doctor or review your latest visits.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/" hash="booking">
                Book an appointment
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CalendarCheck, label: "Upcoming appointments", value: "0" },
              { icon: Stethoscope, label: "Past consultations", value: "0" },
              { icon: FileText, label: "Prescriptions", value: "0" },
              { icon: HeartPulse, label: "Lab results", value: "0" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <card.icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
