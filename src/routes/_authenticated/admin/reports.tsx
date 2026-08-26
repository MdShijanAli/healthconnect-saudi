import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, FileBarChart } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReportsData, listDoctorsForFilter } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Sehaty Cloud" },
      { name: "description", content: "Appointments and revenue reports for Sehaty Cloud." },
      { property: "og:title", content: "Reports — Sehaty Cloud" },
      { property: "og:description", content: "Filter and export appointment and revenue data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

const ALL_DOCTORS = "__all__";

type ReportRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  fee: number;
  doctorName: string;
  patientName: string;
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, rows: ReportRow[]) {
  const header = ["Date", "Time", "Doctor", "Patient", "Status", "Fee (SAR)"];
  const lines = rows.map((row) =>
    [
      row.appointment_date,
      row.appointment_time,
      row.doctorName,
      row.patientName,
      row.status,
      String(row.fee),
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const fetchReports = useServerFn(getReportsData);
  const fetchDoctors = useServerFn(listDoctorsForFilter);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [doctorId, setDoctorId] = useState(ALL_DOCTORS);

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    doctorId: doctorId === ALL_DOCTORS ? undefined : doctorId,
  };

  const { data: doctors } = useQuery({
    queryKey: ["admin-doctors-filter"],
    queryFn: () => fetchDoctors() as Promise<{ id: string; fullName: string }[]>,
  });

  const { data, isPending } = useQuery({
    queryKey: ["admin-reports", filters],
    queryFn: () =>
      fetchReports({ data: filters }) as Promise<{
        rows: ReportRow[];
        totalRevenue: number;
        totalAppointments: number;
      }>,
  });

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reports</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Appointments and revenue, filtered and exportable.
          </p>
        </div>
        <Button
          className="rounded-full"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(`sehaty-report-${new Date().toISOString().slice(0, 10)}.csv`, rows)
          }
        >
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="report-start">From</Label>
          <Input
            id="report-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-end">To</Label>
          <Input
            id="report-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-doctor">Doctor</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger id="report-doctor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DOCTORS}>All doctors</SelectItem>
              {(doctors ?? []).map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <FileBarChart className="h-5 w-5 text-primary" />
          <p className="mt-4 text-2xl font-bold">
            {(data?.totalAppointments ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Appointments in range</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <FileBarChart className="h-5 w-5 text-primary" />
          <p className="mt-4 text-2xl font-bold">
            SAR {(data?.totalRevenue ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Revenue from completed appointments</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        {isPending ? (
          <p className="p-6 text-sm text-muted-foreground">Loading report…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No appointments match these filters yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fee (SAR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.appointment_date}</TableCell>
                  <TableCell>{row.appointment_time}</TableCell>
                  <TableCell>{row.doctorName}</TableCell>
                  <TableCell>{row.patientName}</TableCell>
                  <TableCell className="capitalize">{row.status}</TableCell>
                  <TableCell className="text-right">{row.fee.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
