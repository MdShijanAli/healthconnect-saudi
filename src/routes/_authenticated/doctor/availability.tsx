import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  addUnavailableDate,
  getAvailability,
  removeUnavailableDate,
  saveAvailability,
} from "@/lib/doctor.functions";

export const Route = createFileRoute("/_authenticated/doctor/availability")({
  head: () => ({
    meta: [
      { title: "Availability — Sehaty Cloud" },
      { name: "description", content: "Set your weekly working hours and leave dates." },
      { property: "og:title", content: "Availability — Sehaty Cloud" },
      { property: "og:description", content: "Define the slots patients can book with you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AvailabilityPage,
});

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayRow = { dayOfWeek: number; isEnabled: boolean; startTime: string; endTime: string };
type Availability = Awaited<ReturnType<typeof getAvailability>>;

function AvailabilityPage() {
  const fetchAvailability = useServerFn(getAvailability);
  const save = useServerFn(saveAvailability);
  const addDate = useServerFn(addUnavailableDate);
  const removeDate = useServerFn(removeUnavailableDate);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["doctor-availability"],
    queryFn: () => fetchAvailability() as Promise<Availability>,
  });

  const [days, setDays] = useState<DayRow[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    if (data) setDays(data.days);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { days } }),
    onSuccess: () => {
      toast.success("Availability saved");
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addDateMutation = useMutation({
    mutationFn: () => addDate({ data: { date: newDate, reason: newReason.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Date marked unavailable");
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] });
      setNewDate("");
      setNewReason("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeDateMutation = useMutation({
    mutationFn: (id: string) => removeDate({ data: { id } }),
    onSuccess: () => {
      toast.success("Date removed");
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function updateDay(dayOfWeek: number, patch: Partial<DayRow>) {
    setDays((current) => current.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  }

  if (isPending) return <p className="text-sm text-muted-foreground">Loading availability…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Availability</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set your weekly working hours and mark specific dates as unavailable.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Weekly working hours</h2>
        <div className="mt-4 space-y-3">
          {days.map((day) => (
            <div
              key={day.dayOfWeek}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 p-4"
            >
              <div className="flex w-40 items-center gap-3">
                <Switch
                  checked={day.isEnabled}
                  onCheckedChange={(checked) => updateDay(day.dayOfWeek, { isEnabled: checked })}
                  aria-label={`Toggle ${dayNames[day.dayOfWeek]}`}
                />
                <span className="text-sm font-medium">{dayNames[day.dayOfWeek]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-32"
                  disabled={!day.isEnabled}
                  value={day.startTime}
                  onChange={(e) => updateDay(day.dayOfWeek, { startTime: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="w-32"
                  disabled={!day.isEnabled}
                  value={day.endTime}
                  onChange={(e) => updateDay(day.dayOfWeek, { endTime: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          className="mt-5 rounded-full"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save working hours
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Unavailable dates</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Holidays, leave or any date you won't be taking appointments.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="leave-date">Date</Label>
            <Input
              id="leave-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="leave-reason">Reason (optional)</Label>
            <Input
              id="leave-reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g. Annual leave"
            />
          </div>
          <Button
            className="rounded-full"
            disabled={!newDate || addDateMutation.isPending}
            onClick={() => addDateMutation.mutate()}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        </div>

        {(data?.unavailableDates.length ?? 0) === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-center">
            <CalendarOff className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No unavailable dates marked yet.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {data?.unavailableDates.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{new Date(item.date).toLocaleDateString()}</p>
                  {item.reason ? (
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  ) : null}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={removeDateMutation.isPending}
                  onClick={() => removeDateMutation.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
