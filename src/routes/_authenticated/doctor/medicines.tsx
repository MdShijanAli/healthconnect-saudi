import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Pencil, Pill, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createMedicine,
  deleteMedicine,
  listMedicines,
  updateMedicine,
} from "@/lib/doctor.functions";

export const Route = createFileRoute("/_authenticated/doctor/medicines")({
  head: () => ({
    meta: [
      { title: "Medicine List — Sehaty Cloud" },
      { name: "description", content: "Your personal predefined medicine list." },
      { property: "og:title", content: "Medicine List — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Manage the medicines available in your prescription builder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MedicinesPage,
});

type Medicine = { id: string; name: string; common_dosage: string | null; category: string | null };
type FormState = { name: string; commonDosage: string; category: string };

const emptyForm: FormState = { name: "", commonDosage: "", category: "" };

function MedicinesPage() {
  const fetchMedicines = useServerFn(listMedicines);
  const create = useServerFn(createMedicine);
  const update = useServerFn(updateMedicine);
  const remove = useServerFn(deleteMedicine);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["doctor-medicines"],
    queryFn: () => fetchMedicines() as Promise<Medicine[]>,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        commonDosage: editing.common_dosage ?? "",
        category: editing.category ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        commonDosage: form.commonDosage.trim() || undefined,
        category: form.category.trim() || undefined,
      };
      if (editing) {
        await update({ data: { id: editing.id, ...payload } });
      } else {
        await create({ data: payload });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Medicine updated" : "Medicine added");
      queryClient.invalidateQueries({ queryKey: ["doctor-medicines"] });
      setFormOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Medicine deleted");
      queryClient.invalidateQueries({ queryKey: ["doctor-medicines"] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const medicines = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Medicine list</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your personal predefined list, used in the prescription builder.
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add medicine
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading medicines…</p>
      ) : medicines.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <Pill className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            No medicines yet. Add one, or add one while writing a prescription.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Common dosage</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.common_dosage ?? "—"}</TableCell>
                  <TableCell>{medicine.category ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(medicine);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(medicine)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit medicine" : "Add medicine"}</DialogTitle>
            <DialogDescription>Saved to your personal predefined medicine list.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="med-name">Name</Label>
              <Input
                id="med-name"
                required
                minLength={2}
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Amoxicillin"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-dosage">Common dosage</Label>
              <Input
                id="med-dosage"
                maxLength={100}
                value={form.commonDosage}
                onChange={(e) => setForm((f) => ({ ...f, commonDosage: e.target.value }))}
                placeholder="500mg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-category">Category</Label>
              <Input
                id="med-category"
                maxLength={100}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Antibiotic"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full" disabled={saveMutation.isPending}>
                {editing ? "Save changes" : "Add medicine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be removed from your predefined list. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
