import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscription Plans — Sehaty Cloud" },
      { name: "description", content: "Manage doctor subscription pricing plans." },
      { property: "og:title", content: "Subscription Plans — Sehaty Cloud" },
      {
        property: "og:description",
        content: "Create and edit pricing plans for doctors on Sehaty Cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionPlansPage,
});

type Plan = {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  features: string[];
  is_active: boolean;
};

type FormState = {
  name: string;
  price: string;
  billingCycle: "monthly" | "yearly";
  features: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  price: "",
  billingCycle: "monthly",
  features: "",
  isActive: true,
};

function SubscriptionPlansPage() {
  const fetchPlans = useServerFn(listSubscriptionPlans);
  const create = useServerFn(createSubscriptionPlan);
  const update = useServerFn(updateSubscriptionPlan);
  const remove = useServerFn(deleteSubscriptionPlan);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: () => fetchPlans() as Promise<Plan[]>,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        price: String(editing.price),
        billingCycle: editing.billing_cycle as "monthly" | "yearly",
        features: editing.features.join("\n"),
        isActive: editing.is_active,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        billingCycle: form.billingCycle,
        features: form.features
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        isActive: form.isActive,
      };
      if (editing) {
        await update({ data: { id: editing.id, ...payload } });
      } else {
        await create({ data: payload });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Plan updated" : "Plan created");
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      setFormOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Plan deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const plans = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Subscription plans</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pricing plans doctors can subscribe to.
          </p>
        </div>
        <Button className="rounded-full" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add plan
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading plans…</p>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <CreditCard className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No subscription plans yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold tracking-tight">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-extrabold">
                    SAR {plan.price.toLocaleString()}
                    <span className="text-sm font-medium text-muted-foreground">
                      /{plan.billing_cycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </p>
                </div>
                <Badge variant={plan.is_active ? "default" : "secondary"} className="rounded-full">
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {plan.features.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No features listed.</p>
              )}
              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setEditing(plan);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(plan)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit plan" : "Add plan"}</DialogTitle>
            <DialogDescription>
              No payment gateway is connected yet — this only controls what's shown.
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
              <Label htmlFor="plan-name">Plan name</Label>
              <Input
                id="plan-name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Growth"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-price">Price (SAR)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  required
                  min={0}
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="199"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-cycle">Billing cycle</Label>
                <Select
                  value={form.billingCycle}
                  onValueChange={(value: "monthly" | "yearly") =>
                    setForm((f) => ({ ...f, billingCycle: value }))
                  }
                >
                  <SelectTrigger id="plan-cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-features">Features (one per line)</Label>
              <Textarea
                id="plan-features"
                rows={4}
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder={"Unlimited appointments\nPriority support\nCustom booking page"}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
              <Label htmlFor="plan-active" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="plan-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
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
                {editing ? "Save changes" : "Add plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. This cannot be undone.
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
