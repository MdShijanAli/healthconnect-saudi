import type { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function requireActivePatient(
  admin: typeof supabaseAdmin,
  userId: string,
): Promise<void> {
  const { data, error } = await admin
    .from("patient_profiles")
    .select("is_blocked")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data || data.is_blocked) throw new Error("Forbidden");
}
