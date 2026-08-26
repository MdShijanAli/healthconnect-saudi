import { genId, isoNow, mockDb, type NotificationType } from "@/lib/mock-db";

export function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedAppointmentId?: string;
}): void {
  mockDb.notifications.push({
    id: genId(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    relatedAppointmentId: input.relatedAppointmentId ?? null,
    isRead: false,
    createdAt: isoNow(),
  });
}
