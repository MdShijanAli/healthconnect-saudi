import type { supabaseAdmin as SupabaseAdminClient } from "@/integrations/supabase/client.server";

type NotificationType =
  "booking_confirmation" | "appointment_accepted" | "appointment_cancelled" | "prescription_ready";

export async function createNotification(
  admin: typeof SupabaseAdminClient,
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedAppointmentId?: string;
  },
): Promise<void> {
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    related_appointment_id: input.relatedAppointmentId ?? null,
  });
  if (error) throw new Error(error.message);
}
