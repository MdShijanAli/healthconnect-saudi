import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Star, Stethoscope, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { useSpecializations } from "@/lib/specializations";
import { searchDoctorsForPatient } from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/doctors/")({
  head: () => ({
    meta: [
      { title: "Find a Doctor — Sehaty Cloud" },
      {
        name: "description",
        content: "Search verified doctors by specialization and availability.",
      },
      { property: "og:title", content: "Find a Doctor — Sehaty Cloud" },
      { property: "og:description", content: "Book care with a verified doctor in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindDoctorPage,
});

const ALL_SPECIALIZATIONS = "__all__";
const ANY_AVAILABILITY = "__any__";

type Doctor = Awaited<ReturnType<typeof searchDoctorsForPatient>>[number];

function FindDoctorPage() {
  const { data: specializations } = useSpecializations();
  const fetchDoctors = useServerFn(searchDoctorsForPatient);

  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState(ALL_SPECIALIZATIONS);
  const [availability, setAvailability] = useState(ANY_AVAILABILITY);

  const filters = {
    query: query.trim() || undefined,
    specialization: specialization === ALL_SPECIALIZATIONS ? undefined : specialization,
    availability:
      availability === ANY_AVAILABILITY ? undefined : (availability as "today" | "this_week"),
  };

  const { data: doctors, isPending } = useQuery({
    queryKey: ["patient-search-doctors", filters],
    queryFn: () => fetchDoctors({ data: filters }) as Promise<Doctor[]>,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find a doctor</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Search verified doctors and book in minutes.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor name…"
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-1.5">
            <Label htmlFor="filter-specialization">Specialization</Label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger id="filter-specialization">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SPECIALIZATIONS}>All specializations</SelectItem>
                {(specializations ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-availability">Availability</Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger id="filter-availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_AVAILABILITY}>Any time</SelectItem>
                <SelectItem value="today">Available today</SelectItem>
                <SelectItem value="this_week">Available this week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </aside>

        <div>
          {isPending ? (
            <p className="text-sm text-muted-foreground">Loading doctors…</p>
          ) : !doctors || doctors.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
              <Stethoscope className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                No doctors match these filters yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => (
                <article
                  key={doctor.user_id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
                >
                  <div className="flex h-40 items-center justify-center bg-accent">
                    {doctor.photoUrl ? (
                      <img
                        src={doctor.photoUrl}
                        alt={doctor.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-accent-foreground" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold tracking-tight">{doctor.full_name}</h3>
                    <p className="mt-0.5 text-sm font-medium text-primary">
                      {doctor.specialization}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doctor.years_experience} years experience
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5" />
                      ))}
                      <span className="ml-1">New</span>
                    </div>
                    <div className="mt-3 flex-1" />
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="rounded-full">
                        SAR {doctor.consultation_fee}
                      </Badge>
                      <Button asChild size="sm" className="rounded-full">
                        <Link to="/patient/doctors/$doctorId" params={{ doctorId: doctor.user_id }}>
                          View profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
