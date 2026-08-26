import type { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function requireApprovedDoctor(
  admin: typeof supabaseAdmin,
  userId: string,
): Promise<void> {
  const { data, error } = await admin
    .from("doctor_profiles")
    .select("approval_status, is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data || data.approval_status !== "approved" || !data.is_active) {
    throw new Error("Forbidden");
  }
}
