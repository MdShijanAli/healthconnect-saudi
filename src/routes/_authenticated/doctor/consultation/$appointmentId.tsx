import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ChevronDown, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  completeConsultation,
  createMedicine,
  getConsultationContext,
  listMedicines,
} from "@/lib/doctor.functions";

export const Route = createFileRoute("/_authenticated/doctor/consultation/$appointmentId")({
  head: () => ({
    meta: [
      { title: "Consultation — Sehaty Cloud" },
      {
        name: "description",
        content: "Write diagnosis notes and a prescription for this consultation.",
      },
      { property: "og:title", content: "Consultation — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Complete the consultation and issue a prescription.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationPage,
});

type ConsultationContext = Awaited<ReturnType<typeof getConsultationContext>>;
type Medicine = Awaited<ReturnType<typeof listMedicines>>[number];

type PrescriptionItem = {
  key: string;
  medicineId: string | null;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

function ConsultationPage() {
  const { appointmentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchContext = useServerFn(getConsultationContext);
  const fetchMedicines = useServerFn(listMedicines);
  const addMedicine = useServerFn(createMedicine);
  const saveConsultation = useServerFn(completeConsultation);

  const { data, isPending, error } = useQuery({
    queryKey: ["doctor-consultation-context", appointmentId],
    queryFn: () => fetchContext({ data: { appointmentId } }) as Promise<ConsultationContext>,
  });
  const { data: medicines } = useQuery({
    queryKey: ["doctor-medicines"],
    queryFn: () => fetchMedicines() as Promise<Medicine[]>,
  });

  const [visitSummaryOpen, setVisitSummaryOpen] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [adviceNotes, setAdviceNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const medicineByName = useMemo(
    () => new Map((medicines ?? []).map((m) => [m.name, m])),
    [medicines],
  );

  const addMedicineMutation = useMutation({
    mutationFn: (name: string) => addMedicine({ data: { name } }),
    onSuccess: (medicine) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-medicines"] });
      addItem(medicine.id, medicine.name);
      setSearchOpen(false);
      setSearchQuery("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      saveConsultation({
        data: {
          appointmentId,
          diagnosisNotes: diagnosisNotes.trim() || undefined,
          adviceNotes: adviceNotes.trim() || undefined,
          items: items.map((item) => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosage: item.dosage || undefined,
            frequency: item.frequency || undefined,
            duration: item.duration || undefined,
            instructions: item.instructions || undefined,
          })),
        },
      }),
    onSuccess: () => {
      toast.success("Consultation completed and prescription saved");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
      navigate({ to: "/doctor/appointments" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function addItem(medicineId: string | null, medicineName: string) {
    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        medicineId,
        medicineName,
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<PrescriptionItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function selectMedicine(name: string) {
    const medicine = medicineByName.get(name);
    addItem(medicine?.id ?? null, name);
    setSearchOpen(false);
    setSearchQuery("");
  }

  if (isPending) return <p className="text-sm text-muted-foreground">Loading consultation…</p>;
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm font-medium text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const { patient, pastVisits } = data!;
  const filteredMedicines = (medicines ?? []).filter((m) =>
    m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );
  const exactMatch = (medicines ?? []).some(
    (m) => m.name.toLowerCase() === searchQuery.trim().toLowerCase(),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{patient.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.age} years · <span className="capitalize">{patient.gender}</span> ·{" "}
              {patient.phone}
            </p>
          </div>
        </div>

        <Collapsible open={visitSummaryOpen} onOpenChange={setVisitSummaryOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              Past visit summary ({pastVisits.length})
              <ChevronDown
                className={`ml-1.5 h-4 w-4 transition-transform ${visitSummaryOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {pastVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No previous visits.</p>
            ) : (
              pastVisits.map((visit) => (
                <div key={visit.id} className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium">
                    {new Date(visit.appointment_date).toLocaleDateString()} ·{" "}
                    <span className="capitalize">{visit.status}</span>
                  </p>
                  {visit.reason ? (
                    <p className="mt-0.5 text-muted-foreground">{visit.reason}</p>
                  ) : null}
                  {visit.prescription?.diagnosis_notes ? (
                    <p className="mt-1 text-muted-foreground">
                      Dx: {visit.prescription.diagnosis_notes}
                    </p>
                  ) : null}
                  {visit.prescription && visit.prescription.items.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {visit.prescription.items.map((i) => i.medicine_name).join(", ")}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Label htmlFor="diagnosis-notes">Chief complaint / diagnosis notes</Label>
        <Textarea
          id="diagnosis-notes"
          className="mt-1.5"
          rows={4}
          value={diagnosisNotes}
          onChange={(e) => setDiagnosisNotes(e.target.value)}
          placeholder="What brings the patient in today, and your diagnosis…"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Prescription</h2>

        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="mt-3 w-full justify-start rounded-full text-muted-foreground"
            >
              <Search className="mr-2 h-4 w-4" /> Search or add a medicine…
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Type a medicine name…"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {filteredMedicines.length === 0 ? (
                  <CommandEmpty className="p-2">
                    {searchQuery.trim().length > 1 ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        disabled={addMedicineMutation.isPending}
                        onClick={() => addMedicineMutation.mutate(searchQuery.trim())}
                      >
                        {addMedicineMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add &quot;{searchQuery.trim()}&quot; as new medicine
                      </button>
                    ) : (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        Type to search medicines.
                      </p>
                    )}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredMedicines.map((medicine) => (
                      <CommandItem
                        key={medicine.id}
                        value={medicine.name}
                        onSelect={selectMedicine}
                      >
                        {medicine.name}
                        {medicine.category ? (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {medicine.category}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                    {searchQuery.trim().length > 1 && !exactMatch ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        disabled={addMedicineMutation.isPending}
                        onClick={() => addMedicineMutation.mutate(searchQuery.trim())}
                      >
                        <Plus className="h-4 w-4" />
                        Add &quot;{searchQuery.trim()}&quot; as new medicine
                      </button>
                    ) : null}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No medicines added yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.key} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.medicineName}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Dosage</Label>
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateItem(item.key, { dosage: e.target.value })}
                      placeholder="500mg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <Input
                      value={item.frequency}
                      onChange={(e) => updateItem(item.key, { frequency: e.target.value })}
                      placeholder="1-0-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration</Label>
                    <Input
                      value={item.duration}
                      onChange={(e) => updateItem(item.key, { duration: e.target.value })}
                      placeholder="5 days"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Special instructions</Label>
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateItem(item.key, { instructions: e.target.value })}
                      placeholder="After food"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Label htmlFor="advice-notes">Advice / notes</Label>
        <Textarea
          id="advice-notes"
          className="mt-1.5"
          rows={3}
          value={adviceNotes}
          onChange={(e) => setAdviceNotes(e.target.value)}
          placeholder="General instructions for the patient…"
        />
      </div>

      <div className="flex items-center justify-between">
        {items.length === 0 ? (
          <Badge variant="secondary" className="rounded-full">
            Add at least one medicine to save
          </Badge>
        ) : (
          <span />
        )}
        <Button
          size="lg"
          className="rounded-full"
          disabled={completeMutation.isPending || items.length === 0}
          onClick={() => completeMutation.mutate()}
        >
          Save & Complete Consultation
        </Button>
      </div>
    </div>
  );
}
