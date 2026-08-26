import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Clock3, Pill, Users } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";

export const Route = createFileRoute("/_authenticated/doctor/dashboard")({
  head: () => ({
    meta: [
      { title: "Doctor Portal — Sehaty Cloud" },
      { name: "description", content: "Manage your patients, appointments and prescriptions in the Sehaty Cloud doctor portal." },
      { property: "og:title", content: "Doctor Portal — Sehaty Cloud" },
      { property: "og:description", content: "Your clinic day at a glance: appointments, patients and e-prescriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorDashboard,
});

function DoctorDashboard() {
  return (
    <PortalShell allow="doctor" title="Doctor portal" subtitle="Your patients, appointments and prescriptions.">
      {(portal) =>
        portal.doctorStatus !== "approved" ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock3 className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">
              {portal.doctorStatus === "rejected"
                ? "Your application was not approved"
                : "Your application is under review"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {portal.doctorStatus === "rejected"
                ? "Please contact our provider team to review your credentials and reapply."
                : "Our team is verifying your medical license and credentials. You'll get access to your portal as soon as a super admin approves your account."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CalendarCheck, label: "Today's appointments", value: "0" },
              { icon: Users, label: "Active patients", value: "0" },
              { icon: Pill, label: "Prescriptions issued", value: "0" },
              { icon: ClipboardList, label: "Pending notes", value: "0" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <card.icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>
        )
      }
    </PortalShell>
  );
}
