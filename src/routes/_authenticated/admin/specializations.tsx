import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ListTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { useSpecializations, type Specialization } from "@/lib/specializations";
import { getSpecializationIcon, specializationIconNames } from "@/lib/icon-registry";
import {
  createSpecialization,
  deleteSpecialization,
  updateSpecialization,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/specializations")({
  head: () => ({
    meta: [
      { title: "Specializations — Sehaty Cloud" },
      {
        name: "description",
        content: "Manage the medical specializations shown across Sehaty Cloud.",
      },
      { property: "og:title", content: "Specializations — Sehaty Cloud" },
      { property: "og:description", content: "Add, edit or remove medical specializations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpecializationsPage,
});

type FormState = {
  name: string;
  icon: string;
  description: string;
  displayOrder: string;
};

const emptyForm: FormState = { name: "", icon: "Stethoscope", description: "", displayOrder: "0" };

function SpecializationsPage() {
  const { data, isPending } = useSpecializations();
  const create = useServerFn(createSpecialization);
  const update = useServerFn(updateSpecialization);
  const remove = useServerFn(deleteSpecialization);
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Specialization | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Specialization | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        icon: editing.icon,
        description: editing.description,
        displayOrder: String(editing.display_order),
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(specialization: Specialization) {
    setEditing(specialization);
    setFormOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        icon: form.icon,
        description: form.description.trim(),
        displayOrder: Number(form.displayOrder) || 0,
      };
      if (editing) {
        await update({ data: { id: editing.id, ...payload } });
      } else {
        await create({ data: payload });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Specialization updated" : "Specialization added");
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
      setFormOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Specialization deleted");
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const specializations = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Specializations</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Powers the landing page's specialties section and the doctor registration dropdown.
          </p>
        </div>
        <Button className="rounded-full" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add specialization
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading specializations…</p>
      ) : specializations.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <ListTree className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No specializations yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specializations.map((item) => {
            const Icon = getSpecializationIcon(item.icon);
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-bold tracking-tight">{item.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description || "No description yet."}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit specialization" : "Add specialization"}</DialogTitle>
            <DialogDescription>
              Shown on the landing page and the doctor registration form.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="spec-name">Name</Label>
              <Input
                id="spec-name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Cardiology"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec-icon">Icon</Label>
              <Select
                value={form.icon}
                onValueChange={(value) => setForm((f) => ({ ...f, icon: value }))}
              >
                <SelectTrigger id="spec-icon">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {specializationIconNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec-description">Short description</Label>
              <Textarea
                id="spec-description"
                maxLength={500}
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Diagnosis and treatment of heart and vascular conditions."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec-order">Display order</Label>
              <Input
                id="spec-order"
                type="number"
                min={0}
                max={9999}
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
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
                {editing ? "Save changes" : "Add specialization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete specialization?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be removed from the landing page and the doctor
              registration dropdown. This cannot be undone.
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
