import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { completeRegistrationSchema, reviewDoctorSchema } from "@/lib/auth-schemas";

export const completeRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => completeRegistrationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existingRole) throw new Error("This account is already registered.");

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: context.userId,
      full_name: data.fullName,
      phone: data.phone,
    });
    if (profileError) throw new Error(profileError.message);

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId,
      role: data.role,
    });
    if (roleError) {
      await supabaseAdmin.from("profiles").delete().eq("id", context.userId);
      throw new Error(roleError.message);
    }

    const detailsResult =
      data.role === "patient"
        ? await supabaseAdmin.from("patient_profiles").insert({
            user_id: context.userId,
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
          })
        : await supabaseAdmin.from("doctor_profiles").insert({
            user_id: context.userId,
            specialization: data.specialization,
            medical_license_number: data.medicalLicenseNumber,
            years_experience: data.yearsExperience,
            consultation_fee: data.consultationFee,
            bio: data.bio,
            profile_photo_path: data.profilePhotoPath,
          });

    if (detailsResult.error) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId);
      await supabaseAdmin.from("profiles").delete().eq("id", context.userId);
      throw new Error(detailsResult.error.message);
    }

    return { role: data.role };
  });

export const getPortalContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_my_portal_context");
    if (error) throw new Error(error.message);
    const portal = data[0];
    if (!portal) throw new Error("Your account setup is incomplete.");
    return {
      userId: portal.user_id,
      fullName: portal.full_name,
      phone: portal.phone,
      role: portal.role,
      doctorStatus: portal.doctor_status,
    };
  });

export const listPendingDoctors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doctors, error } = await supabaseAdmin
      .from("doctor_profiles")
      .select("user_id, specialization, medical_license_number, years_experience, consultation_fee, bio, profile_photo_path, approval_status, created_at")
      .eq("approval_status", "pending_approval")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const ids = doctors.map((doctor) => doctor.user_id);
    const { data: profiles, error: profileError } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    return doctors.map((doctor) => ({ ...doctor, profile: profileById.get(doctor.user_id) ?? null }));
  });

export const reviewDoctor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reviewDoctorSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("doctor_profiles")
      .update({ approval_status: data.status, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("user_id", data.doctorId)
      .eq("approval_status", "pending_approval");
    if (error) throw new Error(error.message);
    return { ok: true };
  });