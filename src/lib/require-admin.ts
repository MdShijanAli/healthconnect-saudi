import type { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function isSuperAdmin(admin: typeof supabaseAdmin, userId: string): Promise<boolean> {
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  return !error && !!data;
}

export async function requireSuperAdmin(
  admin: typeof supabaseAdmin,
  userId: string,
): Promise<void> {
  if (!(await isSuperAdmin(admin, userId))) throw new Error("Forbidden");
}
