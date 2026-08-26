import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellRing, CalendarCheck, CalendarX2, FileCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/patient.functions";

export const Route = createFileRoute("/_authenticated/patient/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Sehaty Cloud" },
      {
        name: "description",
        content: "Appointment reminders, prescription alerts and booking confirmations.",
      },
      { property: "og:title", content: "Notifications — Sehaty Cloud" },
      { property: "og:description", content: "Stay up to date on your care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

type Notification = Awaited<ReturnType<typeof listNotifications>>[number];

const typeIcons: Record<string, typeof Bell> = {
  booking_confirmation: CalendarCheck,
  appointment_accepted: CalendarCheck,
  appointment_cancelled: CalendarX2,
  prescription_ready: FileCheck,
};

function NotificationsPage() {
  const fetchNotifications = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAllRead = useServerFn(markAllNotificationsRead);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["patient-notifications"],
    queryFn: () => fetchNotifications() as Promise<Notification[]>,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["patient-notifications"] });
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead({ data: { id } }),
    onSuccess: invalidate,
  });
  const markAllMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: invalidate,
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Reminders, confirmations and prescription alerts.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <BellRing className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Nothing here yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] ?? Bell;
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => !notification.is_read && markReadMutation.mutate(notification.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                  notification.is_read
                    ? "border-border/60 bg-card"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    {!notification.is_read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
