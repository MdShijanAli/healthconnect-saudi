import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listPatientPrescriptions } from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/prescriptions")({
  head: () => ({
    meta: [
      { title: "My Prescriptions — Sehaty Cloud" },
      { name: "description", content: "All your past prescriptions in one place." },
      { property: "og:title", content: "My Prescriptions — Sehaty Cloud" },
      { property: "og:description", content: "Review medicines, dosage and doctor's notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrescriptionsPage,
});

type Prescription = Awaited<ReturnType<typeof listPatientPrescriptions>>[number];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadPrescriptionPdf(prescription: Prescription) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const itemsHtml = prescription.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.medicine_name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.dosage ?? "—")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.frequency ?? "—")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.duration ?? "—")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.instructions ?? "—")}</td>
        </tr>`,
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Prescription — ${escapeHtml(prescription.doctorName)}</title>
        <style>
          body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1f2937; padding: 32px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          p { margin: 0 0 4px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { text-align: left; padding: 8px 12px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; color: #6b7280; }
          .muted { color: #6b7280; }
          .section { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Sehaty Cloud — Prescription</h1>
        <p class="muted">${new Date(prescription.created_at).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>${escapeHtml(prescription.doctorName)}</strong> — ${escapeHtml(prescription.specialization)}</p>
        ${prescription.diagnosis_notes ? `<div class="section"><strong>Diagnosis</strong><p>${escapeHtml(prescription.diagnosis_notes)}</p></div>` : ""}
        <table>
          <thead>
            <tr>
              <th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        ${prescription.advice_notes ? `<div class="section"><strong>Advice</strong><p>${escapeHtml(prescription.advice_notes)}</p></div>` : ""}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function PrescriptionsPage() {
  const fetchPrescriptions = useServerFn(listPatientPrescriptions);
  const { data, isPending } = useQuery({
    queryKey: ["patient-prescriptions"],
    queryFn: () => fetchPrescriptions() as Promise<Prescription[]>,
  });

  const prescriptions = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My prescriptions</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          All prescriptions issued by your doctors.
        </p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading prescriptions…</p>
      ) : prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <FileText className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No prescriptions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {new Date(prescription.created_at).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{prescription.doctorName}</h3>
                  <p className="text-sm text-muted-foreground">{prescription.specialization}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => downloadPrescriptionPdf(prescription)}
                >
                  <Download className="mr-1.5 h-4 w-4" /> Download PDF
                </Button>
              </div>

              {prescription.diagnosis_notes ? (
                <p className="mt-3 text-sm text-muted-foreground">{prescription.diagnosis_notes}</p>
              ) : null}

              {prescription.items.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-sm">
                  {prescription.items.map((item) => (
                    <li key={item.id} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{item.medicine_name}</span>
                      {item.dosage ? ` — ${item.dosage}` : ""}
                      {item.frequency ? `, ${item.frequency}` : ""}
                      {item.duration ? ` for ${item.duration}` : ""}
                      {item.instructions ? ` (${item.instructions})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}

              {prescription.advice_notes ? (
                <p className="mt-4 text-sm italic text-muted-foreground">
                  {prescription.advice_notes}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
